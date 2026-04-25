import * as Phaser from 'phaser';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 800;
const LANE_HEIGHT = 50;
const SPAWN_Y = GAME_HEIGHT - LANE_HEIGHT / 2;

// New Boundaries
const STAGE_BOTTOM_Y = 150;
const SECURITY_BOTTOM_Y = 250;

interface BeatEvent {
  time: number;
  type: 'build' | 'drop' | 'peak';
}

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  
  private crowdGroup!: Phaser.Physics.Arcade.Group;
  private securityBarrierGroup!: Phaser.Physics.Arcade.Group; // The static gaps
  private securityChaseGroup!: Phaser.Physics.Arcade.Group; // The chasers in the gray area
  private roadiesGroup!: Phaser.Physics.Arcade.Group; // The chasers on the stage
  private lineCrowdGroup!: Phaser.Physics.Arcade.Group;
  private musiciansGroup!: Phaser.Physics.Arcade.Group;
  private crowdBarrier!: any;
  
  private hype: number = 0;
  private hypeText!: Phaser.GameObjects.Text;
  private isDiving: boolean = false;
  private isPerforming: boolean = false;
  private stageEntryTime: number = 0;
  
  // Music logic
  private musicTime: number = 0;
  private currentEventIndex: number = 0;
  private beatMap: { bpm: number; events: BeatEvent[] } = {
    bpm: 120,
    events: [
      { time: 10, type: 'build' },
      { time: 20, type: 'drop' },
      { time: 40, type: 'peak' },
      { time: 55, type: 'build' }
    ]
  };

  // Crowd settings
  private publicNumber: number = 100;
  private pushForce: number = -20;
  private jostleForce: number = 50;
  private physicsBounce: number = 0.4;
  private aggroMultiplier: number = 4.0; // Adjust this to make aggro entities push harder (1.0 = normal, 2.0 = double)

  // Line Crowd settings
  private lineSpawnRate: number = 1200;
  private lineBaseSpeed: number = 100;
  private aggressiveChance: number = 0.2;
  private lastLineSpawnTime: number = 0;

  constructor() {
    super('GameScene');
  }

  preload() {
    const graphics = this.add.graphics();
    
    // Player: cyan circle with a pink mohawk
    graphics.fillStyle(0x00ffcc, 1);
    graphics.fillCircle(16, 16, 16);
    graphics.fillStyle(0xff00ff, 1);
    graphics.fillTriangle(16, 0, 8, 10, 24, 10); // Mohawk
    graphics.generateTexture('player', 32, 32);
    graphics.clear();

    // Normal Crowd: pink circle with a dark center
    graphics.fillStyle(0xff0066, 1);
    graphics.fillCircle(20, 20, 20);
    graphics.fillStyle(0x880033, 1);
    graphics.fillCircle(20, 20, 10);
    graphics.generateTexture('crowd', 40, 40);
    graphics.clear();

    // Aggro Crowd: red circle with yellow spikes
    graphics.fillStyle(0xff3300, 1);
    graphics.fillCircle(22, 22, 22);
    graphics.lineStyle(3, 0xffff00, 1);
    for(let i=0; i<8; i++) {
        const angle = (i * Math.PI) / 4;
        graphics.moveTo(22 + Math.cos(angle)*18, 22 + Math.sin(angle)*18);
        graphics.lineTo(22 + Math.cos(angle)*26, 22 + Math.sin(angle)*26);
    }
    graphics.strokePath();
    graphics.generateTexture('crowd_aggro', 44, 44);
    graphics.clear();

    // Security Wall: metal barricade
    graphics.fillStyle(0x444444, 1);
    graphics.fillRect(0, 0, 60, 60);
    graphics.lineStyle(4, 0x888888, 1);
    graphics.strokeRect(4, 4, 52, 52);
    graphics.moveTo(10, 10); graphics.lineTo(50, 50);
    graphics.moveTo(50, 10); graphics.lineTo(10, 50);
    graphics.strokePath();
    graphics.generateTexture('security_wall', 60, 60);
    graphics.clear();

    // Security Chaser: Gray square with yellow badge and cap
    graphics.fillStyle(0x666666, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(0, 0, 32, 10); // cap visor
    graphics.fillStyle(0xffff00, 1);
    graphics.fillRect(12, 14, 8, 10); // badge
    graphics.generateTexture('security_chaser', 32, 32);
    graphics.clear();

    // Roadie: Black square with headset
    graphics.fillStyle(0x222222, 1);
    graphics.fillRect(0, 0, 28, 28);
    graphics.lineStyle(2, 0x00ffff, 1);
    graphics.strokeCircle(28, 14, 6); // headset ear
    graphics.moveTo(22, 14); graphics.lineTo(14, 20); // mic boom
    graphics.strokePath();
    graphics.generateTexture('roadie', 28, 28);
    graphics.clear();

    // Vocalist: Circle holding a mic stand
    graphics.fillStyle(0x00ffaa, 1);
    graphics.fillCircle(14, 14, 14);
    graphics.fillStyle(0x222222, 1); // mic base
    graphics.fillCircle(14, 28, 6);
    graphics.lineStyle(2, 0xdddddd, 1); // mic pole
    graphics.moveTo(14, 28); graphics.lineTo(14, 14);
    graphics.strokePath();
    graphics.fillStyle(0xcccccc, 1); // mic head
    graphics.fillCircle(14, 12, 4);
    graphics.generateTexture('vocalist', 28, 34);
    graphics.clear();
    
    // Drummer: behind a drum kit
    graphics.fillStyle(0xffaa00, 1);
    graphics.fillCircle(20, 10, 10); // drummer head
    graphics.fillStyle(0xeeeeee, 1);
    graphics.fillCircle(10, 24, 8); // tom 1
    graphics.fillCircle(30, 24, 8); // tom 2
    graphics.fillCircle(20, 32, 12); // kick
    graphics.fillStyle(0xddaa00, 1);
    graphics.fillCircle(6, 14, 6); // cymbal 1
    graphics.fillCircle(34, 14, 6); // cymbal 2
    graphics.generateTexture('drummer', 40, 44);
    graphics.clear();
    
    // Guitarist: with a stratocaster shape
    graphics.fillStyle(0x00aaff, 1);
    graphics.fillCircle(16, 16, 12);
    graphics.fillStyle(0xffffff, 1); // pickguard
    graphics.fillRect(6, 14, 10, 6);
    graphics.fillStyle(0x8b4513, 1); // neck
    graphics.fillRect(16, 15, 16, 4);
    graphics.generateTexture('guitarist', 32, 32);
    graphics.clear();
    
    // Bassist: with a longer bass shape
    graphics.fillStyle(0xaa00ff, 1);
    graphics.fillCircle(16, 16, 12);
    graphics.fillStyle(0x333333, 1); // body
    graphics.fillRect(4, 12, 10, 8);
    graphics.fillStyle(0x555555, 1); // neck
    graphics.fillRect(14, 14, 18, 4);
    graphics.generateTexture('bassist', 32, 32);
    graphics.clear();

    graphics.destroy();
  }

  create() {
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    this.drawBackground();

    this.crowdGroup = this.physics.add.group();
    this.securityBarrierGroup = this.physics.add.group({ immovable: true });
    this.lineCrowdGroup = this.physics.add.group({ immovable: true });
    this.securityChaseGroup = this.physics.add.group();
    this.roadiesGroup = this.physics.add.group();
    this.musiciansGroup = this.physics.add.group({ immovable: true });

    // Thick invisible barrier to prevent ALL crowd from invading the stage/security
    // Covers y = 0 to y = 250 (Center at 125, height 250)
    const barrierRect = this.add.rectangle(GAME_WIDTH / 2, 125, GAME_WIDTH, 250);
    barrierRect.setVisible(false);
    this.crowdBarrier = this.physics.add.existing(barrierRect, true); 

    this.player = this.physics.add.sprite(GAME_WIDTH / 2, SPAWN_Y, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(1000);
    this.player.setMass(2);
    this.player.body?.setCircle(16);
    
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
      });
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    this.setupSecurityLane();
    this.spawnPersistentCrowd();
    this.spawnSecurityChasers();
    this.spawnRoadies();
    this.spawnMusicians();

    this.hypeText = this.add.text(10, 10, 'HYPE: 0', {
      fontFamily: 'Outfit', fontSize: '24px', color: '#fff', stroke: '#ff0066', strokeThickness: 4
    }).setDepth(100);

    // Collisions
    this.physics.add.collider(this.crowdGroup, this.crowdGroup);
    this.physics.add.collider(this.crowdGroup, this.crowdBarrier);
    this.physics.add.collider(this.lineCrowdGroup, this.crowdBarrier);
    this.physics.add.collider(this.player, this.crowdGroup, this.handlePitCollision, undefined, this);
    this.physics.add.collider(this.player, this.lineCrowdGroup, this.handleLineCollision, undefined, this);
    this.physics.add.collider(this.crowdGroup, this.lineCrowdGroup);
    
    // Player vs Security Wall
    this.physics.add.collider(this.player, this.securityBarrierGroup);
    
    // Catch Events
    this.physics.add.overlap(this.player, this.securityChaseGroup, this.handleSecurityCatch, undefined, this);
    this.physics.add.overlap(this.player, this.roadiesGroup, this.handleRoadieCatch, undefined, this);
    
    this.resetGameVariables();
  }

  private drawBackground() {
    const numLanes = Math.floor(GAME_HEIGHT / LANE_HEIGHT); // 16 lanes
    for (let i = 0; i < numLanes; i++) {
      const y = i * LANE_HEIGHT;
      const rect = this.add.rectangle(GAME_WIDTH/2, y + LANE_HEIGHT/2, GAME_WIDTH, LANE_HEIGHT);
      
      if (i < 3) {
        // Stage (0-150)
        rect.setFillStyle(0x221144);
      } else if (i < 5) {
        // Security / Front Stage (150-250)
        rect.setFillStyle(0x111111);
      } else if (i === numLanes - 1) {
        // Spawn
        rect.setFillStyle(0x112233);
      } else {
        // Crowd area (250-750)
        rect.setFillStyle(i % 2 === 0 ? 0x1a1a2e : 0x161626);
      }
    }

    // Add stage speakers
    this.add.rectangle(40, 40, 40, 80, 0x111111);
    this.add.circle(40, 20, 10, 0x333333);
    this.add.circle(40, 60, 15, 0x333333);

    this.add.rectangle(GAME_WIDTH - 40, 40, 40, 80, 0x111111);
    this.add.circle(GAME_WIDTH - 40, 20, 10, 0x333333);
    this.add.circle(GAME_WIDTH - 40, 60, 15, 0x333333);
    
    // Stage edge lights
    for(let x = 20; x < GAME_WIDTH; x+= 40) {
        this.add.circle(x, 145, 4, 0x00ffff);
    }
  }

  private setupSecurityLane() {
    // The physical barrier is at y = 250 (bottom of the front stage)
    const securityY = 250;
    for (let x = 30; x < GAME_WIDTH; x += 70) {
      const guard = this.securityBarrierGroup.create(x, securityY, 'security_wall');
      guard.setData('isGuard', true);
    }

    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => {
        const guards = this.securityBarrierGroup.getChildren();
        if (guards.length > 0) {
          guards.forEach((g: any) => g.setActive(true).setVisible(true).body.enable = true);
          const randomGuard = Phaser.Utils.Array.GetRandom(guards) as Phaser.Physics.Arcade.Sprite;
          randomGuard.setActive(false).setVisible(false);
          if(randomGuard.body) randomGuard.body.enable = false;
        }
      }
    });
  }

  private spawnSecurityChasers() {
    // Spawn a few chasers in the Front Stage area (150-250)
    for(let i=0; i<3; i++) {
      const sx = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const sy = Phaser.Math.Between(170, 230);
      const chaser = this.securityChaseGroup.create(sx, sy, 'security_chaser') as Phaser.Physics.Arcade.Sprite;
      chaser.setCollideWorldBounds(true);
    }
  }

  private spawnRoadies() {
    // Spawn 2 roadies on the Stage (0-150) at side edges
    const positions = [
      { x: 30, y: 75 },
      { x: GAME_WIDTH - 30, y: 75 }
    ];
    positions.forEach(pos => {
      const roadie = this.roadiesGroup.create(pos.x, pos.y, 'roadie') as Phaser.Physics.Arcade.Sprite;
      roadie.setCollideWorldBounds(true);
    });
  }

  private spawnMusicians() {
    const band = [
      { x: GAME_WIDTH / 2, y: 120, key: 'vocalist', type: 'vocal' },
      { x: GAME_WIDTH / 2, y: 30, key: 'drummer', type: 'drum' },
      { x: GAME_WIDTH / 2 - 80, y: 80, key: 'guitarist', type: 'guitar' },
      { x: GAME_WIDTH / 2 + 80, y: 80, key: 'bassist', type: 'bass' }
    ];
    
    band.forEach(m => {
      const musician = this.musiciansGroup.create(m.x, m.y, m.key) as Phaser.Physics.Arcade.Sprite;
      musician.setData('type', m.type);
    });
  }

  private spawnPersistentCrowd() {
    // Starts below the new security barrier (250)
    const minY = SECURITY_BOTTOM_Y + 30; 
    const maxY = GAME_HEIGHT - LANE_HEIGHT;
    
    for (let i = 0; i < this.publicNumber; i++) {
      const bias = Math.pow(Math.random(), 2);
      const randomY = minY + bias * (maxY - minY);
      const randomX = Phaser.Math.Between(10, GAME_WIDTH - 10);
      
      const isAggressive = Math.random() < this.aggressiveChance;
      const texture = isAggressive ? 'crowd_aggro' : 'crowd';
      
      const entity = this.crowdGroup.create(randomX, randomY, texture) as Phaser.Physics.Arcade.Sprite;
      
      entity.setCollideWorldBounds(true);
      entity.setBounce(this.physicsBounce);
      entity.setDrag(50);
      
      if (isAggressive) entity.body?.setCircle(22);
      else entity.body?.setCircle(20);
      
      entity.setData('isAggressive', isAggressive);
      entity.setData('jiggleOffsetX', Phaser.Math.Between(0, 1000));
    }
  }

  private resetGameVariables() {
    this.hype = 0;
    this.musicTime = 0;
    this.currentEventIndex = 0;
    this.isDiving = false;
    this.isPerforming = false;
    this.stageEntryTime = 0;
    
    this.pushForce = -30;
    this.jostleForce = 50;
    this.physicsBounce = 0.4;
    this.aggressiveChance = 0.2;
    this.lineSpawnRate = 1200;
    this.lineBaseSpeed = 100;
    this.lastLineSpawnTime = 0;
    
    this.crowdGroup.getChildren().forEach((child: any) => child.setBounce(this.physicsBounce));
    this.lineCrowdGroup.clear(true, true);
    
    this.updateHype(0);
    this.player.setPosition(GAME_WIDTH / 2, SPAWN_Y);
    this.player.setVelocity(0, 0);
    this.player.setAlpha(1);
    this.player.setRotation(0);
    
    const minY = SECURITY_BOTTOM_Y + 30; 
    const maxY = GAME_HEIGHT - LANE_HEIGHT;
    this.crowdGroup.getChildren().forEach((child: any) => {
      const bias = Math.pow(Math.random(), 2);
      child.y = minY + bias * (maxY - minY);
      child.x = Phaser.Math.Between(10, GAME_WIDTH - 10);
      child.setVelocity(0, 0);
    });

    this.securityChaseGroup.getChildren().forEach((child: any) => {
      child.setPosition(Phaser.Math.Between(50, GAME_WIDTH - 50), Phaser.Math.Between(170, 230));
    });
    const positions = [
      { x: 30, y: 75 },
      { x: GAME_WIDTH - 30, y: 75 }
    ];
    this.roadiesGroup.getChildren().forEach((child: any, index: number) => {
      if (positions[index]) child.setPosition(positions[index].x, positions[index].y);
    });

    this.musiciansGroup.getChildren().forEach((child: any) => {
      child.setData('jammed', false);
      child.setAlpha(1);
    });
  }

  update(time: number, delta: number) {
    if (this.isDiving) return;

    this.musicTime += delta / 1000;
    this.processBeatEvents();

    if (!this.isPerforming) {
      this.handlePlayerMovement();
    }
    
    // If player is on stage, build hype quickly!
    if (this.player.y < STAGE_BOTTOM_Y && !this.isPerforming) {
      if (this.stageEntryTime === 0) {
        this.stageEntryTime = time;
        // Show spacebar hint
        const hint = this.add.text(GAME_WIDTH/2, 100, 'SPACE TO INTERACT/DIVE!', {
          fontFamily: 'Outfit', fontSize: '24px', color: '#00ffff', fontStyle: '900', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(200);
        this.tweens.add({
          targets: hint, alpha: 0, y: 80, duration: 2000, onComplete: () => hint.destroy()
        });
      }
      this.updateHype(this.hype + delta * 0.016); // ~10 hype per second
      
      // Intentional stage dive or performance
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        let performed = false;
        
        // Check overlap with musicians
        this.physics.overlap(this.player, this.musiciansGroup, (_p, m: any) => {
          if (!performed && !m.getData('jammed')) {
            performed = true;
            this.performBonusAction(m);
          }
        });
        
        if (!performed) {
          this.executeStageDive(false);
        }
      }
    } else if (this.player.y >= STAGE_BOTTOM_Y) {
      this.stageEntryTime = 0;
    }

    this.updateCrowdAI(time);
    this.updateSecurityAI();
    this.updateRoadiesAI(time);
    this.spawnLineCrowd(time);
    this.updateLineCrowd();
  }

  private performBonusAction(musician: Phaser.Physics.Arcade.Sprite) {
    this.isPerforming = true;
    this.player.setVelocity(0, 0);
    musician.setData('jammed', true);
    musician.setAlpha(0.5); // Visually indicate they are exhausted
    
    const type = musician.getData('type');
    let textStr = "JAMMING!";
    let points = 200;
    
    if (type === 'vocal') textStr = "VOCAL HARMONY!";
    if (type === 'drum') textStr = "BEAT DROP!";
    if (type === 'guitar') textStr = "SHREDDING GUITAR!";
    if (type === 'bass') textStr = "SLAPPIN BASS!";
    
    this.updateHype(this.hype + points);
    
    // Reset Roadies instantly!
    const positions = [
      { x: 30, y: 75 },
      { x: GAME_WIDTH - 30, y: 75 }
    ];
    this.roadiesGroup.getChildren().forEach((child: any, index: number) => {
      if (positions[index]) child.setPosition(positions[index].x, positions[index].y);
      child.setVelocity(0,0);
    });
    
    this.cameras.main.flash(200, 0, 255, 255);
    
    const text = this.add.text(GAME_WIDTH/2, 100, textStr, {
      fontFamily: 'Outfit', fontSize: '32px', color: '#00ffff', fontStyle: '900', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);
    
    this.tweens.add({
      targets: text, scaleX: 1.2, scaleY: 1.2, yoyo: true, duration: 300, repeat: 4
    });
    
    // Wait 3 seconds
    this.time.delayedCall(3000, () => {
      text.destroy();
      this.isPerforming = false;
      // Reset the stage entry time to NOW so they lag for 1.5s after performance finishes
      this.stageEntryTime = this.time.now;
    });
  }

  private processBeatEvents() {
    if (this.currentEventIndex < this.beatMap.events.length) {
      const nextEvent = this.beatMap.events[this.currentEventIndex];
      if (this.musicTime >= nextEvent.time) {
        this.triggerMusicEvent(nextEvent.type);
        this.currentEventIndex++;
      }
    }
  }

  private triggerMusicEvent(type: 'build' | 'drop' | 'peak') {
    if (type === 'drop') this.cameras.main.shake(300, 0.01);
    
    switch (type) {
      case 'build':
        this.pushForce = -50;
        this.jostleForce = 80;
        this.physicsBounce = 0.5;
        this.lineSpawnRate = 800;
        this.lineBaseSpeed = 140;
        break;
      case 'drop':
        this.pushForce = -120; 
        this.jostleForce = 200; 
        this.physicsBounce = 0.8; 
        this.lineSpawnRate = 400;
        this.lineBaseSpeed = 220;
        break;
      case 'peak':
        this.pushForce = -80;
        this.jostleForce = 120;
        this.physicsBounce = 0.6;
        this.lineSpawnRate = 600;
        this.lineBaseSpeed = 180;
        break;
    }
    
    this.crowdGroup.getChildren().forEach((child: any) => child.setBounce(this.physicsBounce));
    
    const text = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, type.toUpperCase() + '!', {
      fontFamily: 'Outfit', fontSize: '48px', color: '#00ffff', fontStyle: '900'
    }).setOrigin(0.5).setAlpha(0).setDepth(200);
    
    this.tweens.add({
      targets: text, alpha: 1, y: GAME_HEIGHT/2 - 50, duration: 300, yoyo: true, hold: 500, onComplete: () => text.destroy()
    });
  }

  private handlePlayerMovement() {
    const speed = 250; // Increased speed so player can outrun AI
    let vX = 0; let vY = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) vX = -speed;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vX = speed;
    if (this.cursors.up.isDown || this.wasd.up.isDown) vY = -speed;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vY = speed;

    if (vX !== 0) this.player.setVelocityX(vX);
    if (vY !== 0) this.player.setVelocityY(vY);
  }

  private updateSecurityAI() {
    const aiSpeed = 100;
    this.securityChaseGroup.getChildren().forEach((child: any) => {
      const ai = child as Phaser.Physics.Arcade.Sprite;
      
      // Only chase if player is in the front stage area (150 to 250)
      if (this.player.y < SECURITY_BOTTOM_Y && this.player.y > STAGE_BOTTOM_Y) {
        this.physics.moveToObject(ai, this.player, aiSpeed);
      } else {
        // Return to patrol or stop
        ai.setVelocity(0, 0);
      }
      
      // Clamp them to Front Stage
      if (ai.y < STAGE_BOTTOM_Y) ai.y = STAGE_BOTTOM_Y;
      if (ai.y > SECURITY_BOTTOM_Y) ai.y = SECURITY_BOTTOM_Y;
    });
  }

  private updateRoadiesAI(time: number) {
    if (this.isPerforming) {
      this.roadiesGroup.getChildren().forEach((child: any) => child.setVelocity(0,0));
      return;
    }

    const aiSpeed = 160; // Faster than security, but slower than player
    this.roadiesGroup.getChildren().forEach((child: any) => {
      const ai = child as Phaser.Physics.Arcade.Sprite;
      
      // Only chase if player is on the stage AND 0.5 seconds have passed
      if (this.player.y < STAGE_BOTTOM_Y && this.stageEntryTime > 0 && time > this.stageEntryTime + 500) {
        this.physics.moveToObject(ai, this.player, aiSpeed);
      } else {
        ai.setVelocity(0, 0);
      }
      
      // Clamp them to Stage
      if (ai.y > STAGE_BOTTOM_Y) ai.y = STAGE_BOTTOM_Y;
    });
  }

  private updateCrowdAI(time: number) {
    this.crowdGroup.getChildren().forEach((child: any) => {
      const entity = child as Phaser.Physics.Arcade.Sprite;
      const isAggressive = entity.getData('isAggressive');
      const offset = entity.getData('jiggleOffsetX');
      
      const pushMultiplier = isAggressive ? this.aggroMultiplier : 1.0;
      let targetVelocityY = this.pushForce * pushMultiplier;
      const jostleTime = (time + offset) * 0.005;
      const targetVelocityX = Math.sin(jostleTime) * this.jostleForce * pushMultiplier;
      
      entity.setAcceleration(targetVelocityX, targetVelocityY);
      entity.setMaxVelocity(this.jostleForce * 1.5, Math.abs(this.pushForce) * 2);
      
      const minSafeY = SECURITY_BOTTOM_Y + 25; // 250 + radius buffer
      if (entity.y < minSafeY) {
        entity.y = minSafeY;
        if (entity.body && entity.body.velocity.y < 0) {
            entity.setVelocityY(0);
        }
      }
    });
  }

  private spawnLineCrowd(time: number) {
    if (time > this.lastLineSpawnTime + this.lineSpawnRate) {
      this.lastLineSpawnTime = time;
      
      const numSpawns = Phaser.Math.Between(1, 3);
      for (let i = 0; i < numSpawns; i++) {
        // Spawn strictly inside crowd area
        const numLanes = Math.floor(GAME_HEIGHT / LANE_HEIGHT);
        const lane = Phaser.Math.Between(5, numLanes - 2); // 5 to 14
        const laneY = lane * LANE_HEIGHT + LANE_HEIGHT / 2;
        const direction = Math.random() < 0.5 ? 1 : -1;
        const startX = direction === 1 ? -50 : GAME_WIDTH + 50;
        
        const isAggressive = Math.random() < this.aggressiveChance;
        const texture = isAggressive ? 'crowd_aggro' : 'crowd';
        
        const entity = this.lineCrowdGroup.create(startX, laneY, texture) as Phaser.Physics.Arcade.Sprite;
        entity.setData('direction', direction);
        entity.setData('isAggressive', isAggressive);
        
        if (isAggressive) entity.body?.setCircle(22);
        else entity.body?.setCircle(20);

        const speedOffset = Phaser.Math.Between(-20, 40);
        entity.setVelocityX(direction * (this.lineBaseSpeed + speedOffset));
      }
    }
  }

  private updateLineCrowd() {
    this.lineCrowdGroup.getChildren().forEach((child: any) => {
      const entity = child as Phaser.Physics.Arcade.Sprite;
      const direction = entity.getData('direction');
      if ((direction === 1 && entity.x > GAME_WIDTH + 100) ||
          (direction === -1 && entity.x < -100)) {
        entity.destroy();
      }
      
      const minSafeY = SECURITY_BOTTOM_Y + 25;
      if (entity.y < minSafeY) {
        entity.y = minSafeY;
        if (entity.body && entity.body.velocity.y < 0) {
            entity.setVelocityY(0);
        }
      }
    });
  }

  private handlePitCollision(player: any, crowdEntity: any) {
    const p = player as Phaser.Physics.Arcade.Sprite;
    const c = crowdEntity as Phaser.Physics.Arcade.Sprite;
    const isAggro = c.getData('isAggressive');
    
    if (isAggro && Math.random() < 0.1) {
      const angle = Phaser.Math.Angle.Between(c.x, c.y, p.x, p.y);
      const shoveForce = 100 * this.aggroMultiplier;
      p.setVelocityX((p.body?.velocity.x || 0) + Math.cos(angle) * shoveForce);
      p.setVelocityY((p.body?.velocity.y || 0) + Math.sin(angle) * shoveForce);
      this.cameras.main.shake(100, 0.005);
    }
    
    if (Math.random() < 0.05) this.updateHype(this.hype + 0.5);
  }

  private handleLineCollision(player: any, crowdEntity: any) {
    const p = player as Phaser.Physics.Arcade.Sprite;
    const c = crowdEntity as Phaser.Physics.Arcade.Sprite;
    const isAggro = c.getData('isAggressive');
    
    if (isAggro && Math.random() < 0.2) {
      const angle = Phaser.Math.Angle.Between(c.x, c.y, p.x, p.y);
      const shoveForce = 150 * this.aggroMultiplier;
      p.setVelocityX((p.body?.velocity.x || 0) + Math.cos(angle) * shoveForce);
      p.setVelocityY((p.body?.velocity.y || 0) + Math.sin(angle) * shoveForce);
      this.cameras.main.shake(100, 0.005);
    }
    
    if (Math.random() < 0.05) this.updateHype(this.hype + 0.5);
  }

  private handleSecurityCatch(player: any, _security: any) {
    if (this.isDiving || this.isPerforming) return;
    
    // Thrown out of the pit!
    this.cameras.main.shake(200, 0.02);
    this.cameras.main.flash(200, 255, 0, 0);
    
    // Reset player to spawn
    const p = player as Phaser.Physics.Arcade.Sprite;
    p.setPosition(GAME_WIDTH / 2, SPAWN_Y);
    
    // Hype penalty!
    this.updateHype(Math.max(0, this.hype - 20));
    
    const text = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, 'THROWN OUT!', {
      fontFamily: 'Outfit', fontSize: '42px', color: '#ff0000', fontStyle: '900'
    }).setOrigin(0.5).setDepth(200);
    
    this.time.delayedCall(1000, () => text.destroy());
  }

  private handleRoadieCatch(_player: any, _roadie: any) {
    if (this.isDiving || this.isPerforming) return;
    // Caught by stage crew!
    this.executeStageDive(true);
  }

  private updateHype(val: number) {
    this.hype = Phaser.Math.Clamp(val, 0, 1000);
    this.hypeText.setText(`HYPE: ${Math.floor(this.hype)}`);
    
    if (this.hype < 300) this.hypeText.setColor('#ffffff');
    else if (this.hype < 800) this.hypeText.setColor('#ffff00');
    else this.hypeText.setColor('#ff00ff');
  }

  private executeStageDive(forcedByRoadie: boolean = false) {
    this.isDiving = true;
    this.player.setVelocity(0, 0);
    
    let endY = STAGE_BOTTOM_Y + 150; 
    let resultText = "CAUGHT!";
    let color = "#ffff00";
    let isFail = false;
    let isEpic = false;
    
    if (forcedByRoadie) {
      endY = STAGE_BOTTOM_Y + 100;
      resultText = "BUSTED BY ROADIES!";
      color = "#ff0000";
      isFail = true;
    } else if (this.hype < 300) {
      endY = STAGE_BOTTOM_Y + 150;
      resultText = "FACEPLANT!";
      color = "#ff0000";
      isFail = true;
    } else if (this.hype >= 800) {
      endY = STAGE_BOTTOM_Y + 100;
      resultText = "EPIC SURF!";
      color = "#ff00ff";
      isEpic = true;
    }

    if (isFail && !forcedByRoadie) {
      // Part the crowd!
      const allCrowd = [...this.crowdGroup.getChildren(), ...this.lineCrowdGroup.getChildren()];
      allCrowd.forEach((child: any) => {
        const dist = Phaser.Math.Distance.Between(child.x, child.y, GAME_WIDTH/2, endY);
        if (dist < 80) {
          const angle = Phaser.Math.Angle.Between(GAME_WIDTH/2, endY, child.x, child.y);
          this.tweens.add({
            targets: child,
            x: child.x + Math.cos(angle) * 120,
            y: child.y + Math.sin(angle) * 120,
            duration: 800,
            ease: 'Power2'
          });
        }
      });
    }

    this.tweens.add({
      targets: this.player,
      y: endY,
      rotation: Math.PI * 2 * 4, 
      duration: 1500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (isFail && !forcedByRoadie) {
          this.cameras.main.shake(200, 0.02);
          this.cameras.main.flash(200, 255, 0, 0);
          this.showGameOver(resultText, color);
        } else if (isEpic) {
          // Carry backward
          this.tweens.add({
            targets: this.player,
            y: GAME_HEIGHT - 100,
            duration: 4000,
            ease: 'Linear',
            onUpdate: () => {
              // Make nearby crowd cheer
              this.crowdGroup.getChildren().forEach((child: any) => {
                if (Math.abs(child.y - this.player.y) < 60 && Math.abs(child.x - this.player.x) < 80) {
                  if (!this.tweens.isTweening(child)) {
                    this.tweens.add({ targets: child, scaleY: 1.2, scaleX: 1.2, yoyo: true, duration: 200 });
                  }
                }
              });
            },
            onComplete: () => {
              this.showGameOver(resultText, color);
            }
          });
        } else {
          this.showGameOver(resultText, color);
        }
      }
    });
  }

  private showGameOver(text: string, color: string) {
    const bg = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
    bg.setDepth(200);
    
    const result = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 50, text, {
      fontFamily: 'Outfit', fontSize: '42px', fontStyle: '900', color: color
    }).setOrigin(0.5).setDepth(201);
    
    const score = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 20, `HYPE SCORE: ${Math.floor(this.hype)}`, {
      fontFamily: 'Outfit', fontSize: '24px', color: '#fff'
    }).setOrigin(0.5).setDepth(201);

    const restartBtn = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 100, '> RESTART <', {
      fontFamily: 'Outfit', fontSize: '28px', color: '#00ffff'
    }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerdown', () => {
      bg.destroy();
      result.destroy();
      score.destroy();
      restartBtn.destroy();
      this.resetGameVariables();
    });
    
    this.tweens.add({
      targets: [result, score, restartBtn],
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 300,
      ease: 'Back.out'
    });
  }
}
