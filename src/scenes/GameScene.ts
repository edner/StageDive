import * as Phaser from 'phaser';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 800;
const LANE_HEIGHT = 50;
const SPAWN_Y = GAME_HEIGHT - LANE_HEIGHT / 2;
const PLAYER_FRAME_WIDTH = 144;
const PLAYER_FRAME_HEIGHT = 128;
const PLAYER_DISPLAY_SCALE = 0.46;
const PLAYER_BASE_DEPTH = 10;
const PLAYER_CROWD_SURF_DEPTH = 90;
const DRUMMER_DEPTH = 5;
const GUITARIST_DEPTH = 6;
const BASSIST_DEPTH = 6;
const ROADIE_DEPTH = 7;
const VOCALIST_DEPTH = 8;
const EPIC_CROWD_SURF_DURATION = 5600;
const SECURITY_CHASER_FRAME_SIZE = 96;
const ROADIE_FRAME_WIDTH = 224;
const ROADIE_FRAME_HEIGHT = 288;
const ROADIE_DISPLAY_SCALE = 0.21;
const VOCALIST_FRAME_WIDTH = 208;
const VOCALIST_FRAME_HEIGHT = 248;
const VOCALIST_DISPLAY_SCALE = 0.35;
const GUITARIST_FRAME_WIDTH = 208;
const GUITARIST_FRAME_HEIGHT = 216;
const GUITARIST_DISPLAY_SCALE = 0.34;
const BASSIST_FRAME_WIDTH = 224;
const BASSIST_FRAME_HEIGHT = 216;
const BASSIST_DISPLAY_SCALE = 0.34;
const DRUMMER_FRAME_WIDTH = 229;
const DRUMMER_FRAME_HEIGHT = 230;
const DRUMMER_DISPLAY_SCALE = 0.34;
const VOCALIST_HOME_POSITION = { x: GAME_WIDTH / 2, y: 120 } as const;
const GUITARIST_HOME_POSITION = { x: GAME_WIDTH / 2 - 82, y: 86 } as const;
const BASSIST_HOME_POSITION = { x: GAME_WIDTH / 2 + 80, y: 86 } as const;
const DRUMMER_HOME_POSITION = { x: GAME_WIDTH / 2, y: 30 } as const;
const STAGE_INTERACTION_RADIUS = 70;
const VOCALIST_WANDER_X_RANGE = 92;
const VOCALIST_WANDER_UP_RANGE = 42;
const VOCALIST_WANDER_DOWN_RANGE = 14;
const VOCALIST_MOVE_SPEED = 58;
const VOCALIST_HOME_STAY_CHANCE = 0.86;
const VOCALIST_RETURN_HOME_CHANCE = 0.9;
const VOCALIST_PERFORMANCE_MIN_MS = 900;
const VOCALIST_PERFORMANCE_MAX_MS = 2200;
const VOCALIST_TARGET_REACHED_RADIUS = 8;
const GUITARIST_WANDER_X_RANGE = 126;
const GUITARIST_WANDER_UP_RANGE = 34;
const GUITARIST_WANDER_DOWN_RANGE = 48;
const GUITARIST_MOVE_SPEED = 62;
const GUITARIST_HOME_STAY_CHANCE = 0.84;
const GUITARIST_RETURN_HOME_CHANCE = 0.74;
const GUITARIST_EDGE_VISIT_CHANCE = 0.36;
const GUITARIST_PERFORMANCE_MIN_MS = 1200;
const GUITARIST_PERFORMANCE_MAX_MS = 2600;
const GUITARIST_TARGET_REACHED_RADIUS = 10;
const BASSIST_WANDER_X_RANGE = 126;
const BASSIST_WANDER_UP_RANGE = 34;
const BASSIST_WANDER_DOWN_RANGE = 48;
const BASSIST_MOVE_SPEED = 62;
const BASSIST_HOME_STAY_CHANCE = 0.84;
const BASSIST_RETURN_HOME_CHANCE = 0.74;
const BASSIST_EDGE_VISIT_CHANCE = 0.36;
const BASSIST_PERFORMANCE_MIN_MS = 1200;
const BASSIST_PERFORMANCE_MAX_MS = 2600;
const BASSIST_TARGET_REACHED_RADIUS = 10;
const DRUMMER_PERFORMANCE_MIN_MS = 900;
const DRUMMER_PERFORMANCE_MAX_MS = 1800;
const ROADIE_HOME_POSITIONS = [
  { x: 54, y: 115, idleSide: 'left' },
  { x: GAME_WIDTH - 42, y: 115, idleSide: 'right' }
] as const;
const NORMAL_CROWD_FRAME_SIZE = 96;
const NORMAL_CROWD_DISPLAY_SCALE = 0.56;
const NORMAL_CROWD_VARIANTS = [
  { animationPrefix: 'crowd-normal-1', rowStart: 0 },
  { animationPrefix: 'crowd-normal-2', rowStart: 9 },
  { animationPrefix: 'crowd-normal-3', rowStart: 18 },
  { animationPrefix: 'crowd-normal-4', rowStart: 27 },
  { animationPrefix: 'crowd-normal-5', rowStart: 36 },
  { animationPrefix: 'crowd-normal-6', rowStart: 45 },
  { animationPrefix: 'crowd-normal-7', rowStart: 54 },
  { animationPrefix: 'crowd-normal-8', rowStart: 63 }
] as const;
const AGGRO_CROWD_FRAME_SIZE = 96;
const AGGRO_CROWD_DISPLAY_SCALE = 0.58;
const AGGRO_CROWD_ATTACK_COOLDOWN_MS = 700;
const AGGRO_CROWD_ATTACK_RECOVERY_MS = 260;
const AGGRO_CROWD_PIT_SHOVE_FORCE = 110;
const AGGRO_CROWD_LINE_SHOVE_FORCE = 145;
const AGGRO_HITS_PER_HALF_LIFE = 5;
const AGGRO_CROWD_VARIANTS = [
  { textureKey: 'aggro_crowd_1_sheet', animationPrefix: 'aggro-crowd-1' },
  { textureKey: 'aggro_crowd_2_sheet', animationPrefix: 'aggro-crowd-2' },
  { textureKey: 'aggro_crowd_3_sheet', animationPrefix: 'aggro-crowd-3' },
  { textureKey: 'aggro_crowd_4_sheet', animationPrefix: 'aggro-crowd-4' }
] as const;

// New Boundaries
const STAGE_BOTTOM_Y = 150;
const SECURITY_BOTTOM_Y = 250;

const BONUS_ACTION_DURATION = 3000;
const MUSICIAN_SPECIAL_COOLDOWN = 12000;

interface BeatEvent {
  time: number;
  type: 'build' | 'drop' | 'peak';
}

type SecurityFacing = 'front' | 'back' | 'left' | 'right';
type VocalistFacing = 'front' | 'back' | 'left' | 'right';
type GuitaristFacing = 'front' | 'back' | 'left' | 'right';
type BassistFacing = 'front' | 'back' | 'left' | 'right';
type RoadieFacing = 'front' | 'back' | 'left' | 'right';
type CrowdFacing = 'front' | 'back' | 'left' | 'right';
type RoadieIdleSide = 'left' | 'right';
type RoadiePushDirection = 'left' | 'right' | 'forward';
type PlayerFacing = 'front' | 'back' | 'left' | 'right';
type PlayerSpecialAnimation =
  | 'excited'
  | 'stage-dive-left'
  | 'stage-dive-right'
  | 'stage-dive-down'
  | 'crowd-surf-up'
  | 'faceplant'
  | 'beated';

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private vocalist!: Phaser.Physics.Arcade.Sprite;
  private guitarist!: Phaser.Physics.Arcade.Sprite;
  private bassist!: Phaser.Physics.Arcade.Sprite;
  private drummer!: Phaser.Physics.Arcade.Sprite;
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
  private lives: number = 6;
  private livesText!: Phaser.GameObjects.Text;
  private isDiving: boolean = false;
  private isPerforming: boolean = false;
  private stageEntryTime: number = 0;
  private playerFacing: PlayerFacing = 'front';
  private playerSpecialAnimation: PlayerSpecialAnimation | null = null;
  private playerAggroInvulnerableUntil: number = 0;
  private aggroHitCount: number = 0;
  
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
  private extraCrowdPending: number = 0;
  private extraCrowdTotal: number = 0;
  private extraCrowdTriggered: boolean = false;
  private lastExtraCrowdSpawnTime: number = 0;

  // Line Crowd settings
  private lineSpawnRate: number = 1200;
  private lineBaseSpeed: number = 100;
  private aggressiveChance: number = 0.2;
  private lastLineSpawnTime: number = 0;

  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.spritesheet('player_attendee_sheet', 'assets/player-attendee-sheet.png', {
      frameWidth: PLAYER_FRAME_WIDTH,
      frameHeight: PLAYER_FRAME_HEIGHT
    });

    this.load.spritesheet('security_chaser_sheet', 'assets/security-chaser-sheet.png', {
      frameWidth: SECURITY_CHASER_FRAME_SIZE,
      frameHeight: SECURITY_CHASER_FRAME_SIZE
    });

    this.load.spritesheet('roadie_sheet', 'assets/roadie-sheet.png', {
      frameWidth: ROADIE_FRAME_WIDTH,
      frameHeight: ROADIE_FRAME_HEIGHT
    });

    this.load.spritesheet('vocalist_sheet', 'assets/vocalist-sheet.png', {
      frameWidth: VOCALIST_FRAME_WIDTH,
      frameHeight: VOCALIST_FRAME_HEIGHT
    });

    this.load.spritesheet('guitarist_sheet', 'assets/guitarist-sheet.png', {
      frameWidth: GUITARIST_FRAME_WIDTH,
      frameHeight: GUITARIST_FRAME_HEIGHT
    });

    this.load.spritesheet('bassist_sheet', 'assets/bassist-sheet.png', {
      frameWidth: BASSIST_FRAME_WIDTH,
      frameHeight: BASSIST_FRAME_HEIGHT
    });

    this.load.spritesheet('drummer_sheet', 'assets/drummer-spritesheet.png', {
      frameWidth: DRUMMER_FRAME_WIDTH,
      frameHeight: DRUMMER_FRAME_HEIGHT
    });

    this.load.spritesheet('crowd_normal_sheet', 'assets/crowd-normal-sheet.png', {
      frameWidth: NORMAL_CROWD_FRAME_SIZE,
      frameHeight: NORMAL_CROWD_FRAME_SIZE
    });

    AGGRO_CROWD_VARIANTS.forEach(({ textureKey }, index) => {
      this.load.spritesheet(textureKey, `assets/aggro-crowd-${index + 1}-sheet.png`, {
        frameWidth: AGGRO_CROWD_FRAME_SIZE,
        frameHeight: AGGRO_CROWD_FRAME_SIZE
      });
    });

    const graphics = this.add.graphics();

    // Normal Crowd: pink circle with a dark center
    graphics.fillStyle(0xff0066, 1);
    graphics.fillCircle(20, 20, 20);
    graphics.fillStyle(0x880033, 1);
    graphics.fillCircle(20, 20, 10);
    graphics.generateTexture('crowd', 40, 40);
    graphics.clear();

    this.load.image('rail', 'assets/rail.png');
    this.load.image('broken_rail', 'assets/broken_rail.png');
    this.load.image('pa_speaker', 'assets/pa-speaker.png');
    this.load.image('stage_background', 'assets/stage-background.png');

    graphics.destroy();
  }

  create() {
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    this.drawBackground();
    this.createPlayerAnimations();
    this.createSecurityChaserAnimations();
    this.createRoadieAnimations();
    this.createVocalistAnimations();
    this.createGuitaristAnimations();
    this.createBassistAnimations();
    this.createDrummerAnimations();
    this.createNormalCrowdAnimations();
    this.createAggroCrowdAnimations();

    this.crowdGroup = this.physics.add.group();
    this.securityBarrierGroup = this.physics.add.group({ immovable: true });
    this.lineCrowdGroup = this.physics.add.group({ immovable: true });
    this.securityChaseGroup = this.physics.add.group();
    this.roadiesGroup = this.physics.add.group();
    this.musiciansGroup = this.physics.add.group();

    // Thick invisible barrier to prevent ALL crowd from invading the stage/security
    // Covers y = 0 to y = 250 (Center at 125, height 250)
    const barrierRect = this.add.rectangle(GAME_WIDTH / 2, 125, GAME_WIDTH, 250);
    barrierRect.setVisible(false);
    this.crowdBarrier = this.physics.add.existing(barrierRect, true); 

    this.player = this.physics.add.sprite(GAME_WIDTH / 2, SPAWN_Y, 'player_attendee_sheet', 0);
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(1000);
    this.player.setMass(2);
    this.player.setScale(PLAYER_DISPLAY_SCALE);
    this.player.setDepth(PLAYER_BASE_DEPTH);
    this.configurePlayerBody();
    this.player.play('player-idle-front');
    
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

    this.livesText = this.add.text(GAME_WIDTH - 10, 10, '♥♥♥', {
      fontFamily: 'Outfit', fontSize: '24px', color: '#ff0000', stroke: '#fff', strokeThickness: 2
    }).setOrigin(1, 0).setDepth(100);

    // Collisions
    this.physics.add.collider(this.crowdGroup, this.crowdGroup);
    this.physics.add.collider(this.crowdGroup, this.crowdBarrier, undefined, this.crowdBarrierProcessCallback, this);
    this.physics.add.collider(this.lineCrowdGroup, this.crowdBarrier, undefined, this.crowdBarrierProcessCallback, this);
    this.physics.add.collider(this.player, this.crowdGroup, this.handlePitCollision, undefined, this);
    this.physics.add.collider(this.player, this.lineCrowdGroup, this.handleLineCollision, undefined, this);
    this.physics.add.collider(this.crowdGroup, this.lineCrowdGroup);
    this.physics.add.collider(this.musiciansGroup, this.musiciansGroup);
    this.physics.add.collider(this.roadiesGroup, this.musiciansGroup);
    this.physics.add.collider(this.player, this.musiciansGroup);
    
    // Player vs Security Wall
    this.physics.add.collider(this.player, this.securityBarrierGroup, (p: any, r: any) => {
        if (!r.getData('isBroken')) {
            const angle = Phaser.Math.Angle.Between(p.x, p.y, r.x, r.y);
            r.x += Math.cos(angle) * 1.5;
            r.y += Math.sin(angle) * 1.5;
        }
    });
    
    // Catch Events
    this.physics.add.overlap(this.player, this.securityChaseGroup, this.handleSecurityCatch, undefined, this);
    this.physics.add.overlap(this.player, this.roadiesGroup, this.handleRoadieCatch, undefined, this);
    
    // Security vs Crowd - shove crowd members out of the security area
    this.physics.add.overlap(this.securityChaseGroup, this.crowdGroup, this.handleSecurityVsCrowd, undefined, this);
    this.physics.add.overlap(this.securityChaseGroup, this.lineCrowdGroup, this.handleSecurityVsCrowd, undefined, this);
    
    this.resetGameVariables();
  }

  private drawBackground() {
    const background = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'stage_background');
    const scale = Math.max(
      GAME_WIDTH / background.width,
      GAME_HEIGHT / background.height
    );

    background.setScale(scale);
    background.setDepth(-100);
  }

  private setupSecurityLane() {
    const securityY = 250;
    for (let x = 35; x < GAME_WIDTH; x += 70) {
      const rail = this.securityBarrierGroup.create(x, securityY, 'rail') as Phaser.Physics.Arcade.Sprite;
      rail.setDisplaySize(86, 56);
      rail.setData('isBroken', false);
      
      rail.setImmovable(true);
      rail.setCollideWorldBounds(true);
      rail.setData('startX', x);
      rail.setData('startY', securityY);
    }

    this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        const rails = this.securityBarrierGroup.getChildren().filter((r: any) => !r.getData('isBroken'));
        if (rails.length > 0) {
          const randomRail = Phaser.Utils.Array.GetRandom(rails) as Phaser.Physics.Arcade.Sprite;
          randomRail.setData('isBroken', true);
          randomRail.setTexture('broken_rail');
          if (randomRail.body) {
              randomRail.body.checkCollision.none = true; // Disable collisions entirely
          }
        }
      }
    });
  }

  private spawnSecurityChasers() {
    // Spawn a few chasers in the Front Stage area (150-250)
    for(let i=0; i<3; i++) {
      const sx = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const sy = Phaser.Math.Between(170, 230);
      const chaser = this.securityChaseGroup.create(sx, sy, 'security_chaser_sheet', 0) as Phaser.Physics.Arcade.Sprite;
      chaser.setCollideWorldBounds(true);
      chaser.setScale(0.72);
      chaser.body?.setSize(44, 58, true);
      chaser.setData('facing', 'front');
      chaser.play('security-chaser-idle-front');
    }
  }

  private createSecurityChaserAnimations() {
    if (this.anims.exists('security-chaser-idle-front')) {
      return;
    }

    const animations: Array<{
      key: string;
      frames: number[];
      frameRate: number;
      repeat: number;
    }> = [
      { key: 'security-chaser-idle-front', frames: [0], frameRate: 1, repeat: -1 },
      { key: 'security-chaser-idle-back', frames: [1], frameRate: 1, repeat: -1 },
      { key: 'security-chaser-idle-left', frames: [2], frameRate: 1, repeat: -1 },
      { key: 'security-chaser-idle-right', frames: [3], frameRate: 1, repeat: -1 },
      { key: 'security-chaser-walk-front', frames: [4, 5], frameRate: 5, repeat: -1 },
      { key: 'security-chaser-walk-back', frames: [6, 7], frameRate: 5, repeat: -1 },
      { key: 'security-chaser-walk-left', frames: [8, 9], frameRate: 5, repeat: -1 },
      { key: 'security-chaser-walk-right', frames: [10, 11], frameRate: 5, repeat: -1 }
    ];

    animations.forEach(({ key, frames, frameRate, repeat }) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('security_chaser_sheet', { frames }),
        frameRate,
        repeat
      });
    });
  }

  private createPlayerAnimations() {
    if (this.anims.exists('player-idle-front')) {
      return;
    }

    const animations: Array<{
      key: string;
      frames: number[];
      frameRate: number;
      repeat: number;
    }> = [
      { key: 'player-idle-front', frames: [0], frameRate: 1, repeat: -1 },
      { key: 'player-idle-back', frames: [1], frameRate: 1, repeat: -1 },
      { key: 'player-idle-left', frames: [2], frameRate: 1, repeat: -1 },
      { key: 'player-idle-right', frames: [3], frameRate: 1, repeat: -1 },
      { key: 'player-walk-front', frames: [4, 5], frameRate: 7, repeat: -1 },
      { key: 'player-walk-back', frames: [6, 7], frameRate: 7, repeat: -1 },
      { key: 'player-walk-left', frames: [8, 9], frameRate: 7, repeat: -1 },
      { key: 'player-walk-right', frames: [10, 11], frameRate: 7, repeat: -1 },
      { key: 'player-excited', frames: [12], frameRate: 1, repeat: -1 },
      { key: 'player-stage-dive-left', frames: [13], frameRate: 1, repeat: -1 },
      { key: 'player-stage-dive-right', frames: [14], frameRate: 1, repeat: -1 },
      { key: 'player-stage-dive-down', frames: [15], frameRate: 1, repeat: -1 },
      { key: 'player-crowd-surf-up', frames: [16], frameRate: 1, repeat: -1 },
      { key: 'player-faceplant', frames: [17], frameRate: 1, repeat: -1 },
      { key: 'player-beated', frames: [18], frameRate: 1, repeat: -1 }
    ];

    animations.forEach(({ key, frames, frameRate, repeat }) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('player_attendee_sheet', { frames }),
        frameRate,
        repeat
      });
    });
  }

  private createRoadieAnimations() {
    if (this.anims.exists('roadie-idle-left')) {
      return;
    }

    const animations: Array<{
      key: string;
      frames: number[];
      frameRate: number;
      repeat: number;
    }> = [
      { key: 'roadie-idle-left', frames: [1], frameRate: 1, repeat: -1 },
      { key: 'roadie-idle-right', frames: [0], frameRate: 1, repeat: -1 },
      { key: 'roadie-run-left', frames: [2, 3], frameRate: 6, repeat: -1 },
      { key: 'roadie-run-right', frames: [4, 5], frameRate: 6, repeat: -1 },
      { key: 'roadie-run-back', frames: [6, 7], frameRate: 6, repeat: -1 },
      { key: 'roadie-run-front', frames: [8, 9], frameRate: 6, repeat: -1 },
      { key: 'roadie-push-left', frames: [10], frameRate: 1, repeat: -1 },
      { key: 'roadie-push-right', frames: [11], frameRate: 1, repeat: -1 },
      { key: 'roadie-push-forward', frames: [12], frameRate: 1, repeat: -1 }
    ];

    animations.forEach(({ key, frames, frameRate, repeat }) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('roadie_sheet', { frames }),
        frameRate,
        repeat
      });
    });
  }

  private createNormalCrowdAnimations() {
    if (this.anims.exists('crowd-normal-1-idle-front')) {
      return;
    }

    NORMAL_CROWD_VARIANTS.forEach(({ animationPrefix, rowStart }) => {
      const animations: Array<{
        key: string;
        frames: number[];
        frameRate: number;
        repeat: number;
      }> = [
        { key: `${animationPrefix}-idle-front`, frames: [rowStart + 0], frameRate: 1, repeat: -1 },
        { key: `${animationPrefix}-idle-left`, frames: [rowStart + 2], frameRate: 1, repeat: -1 },
        { key: `${animationPrefix}-idle-right`, frames: [rowStart + 2], frameRate: 1, repeat: -1 },
        { key: `${animationPrefix}-idle-back`, frames: [rowStart + 8], frameRate: 1, repeat: -1 },
        { key: `${animationPrefix}-walk-front`, frames: [rowStart + 0, rowStart + 5], frameRate: 5, repeat: -1 },
        { key: `${animationPrefix}-walk-left`, frames: [rowStart + 1, rowStart + 2, rowStart + 3, rowStart + 4], frameRate: 7, repeat: -1 },
        { key: `${animationPrefix}-walk-right`, frames: [rowStart + 1, rowStart + 2, rowStart + 3, rowStart + 4], frameRate: 7, repeat: -1 },
        { key: `${animationPrefix}-walk-back`, frames: [rowStart + 6, rowStart + 7, rowStart + 8, rowStart + 7], frameRate: 6, repeat: -1 }
      ];

      animations.forEach(({ key, frames, frameRate, repeat }) => {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers('crowd_normal_sheet', { frames }),
          frameRate,
          repeat
        });
      });
    });
  }

  private createAggroCrowdAnimations() {
    if (this.anims.exists('aggro-crowd-1-idle-front')) {
      return;
    }

    AGGRO_CROWD_VARIANTS.forEach(({ textureKey, animationPrefix }) => {
      const animations: Array<{
        key: string;
        frames: number[];
        frameRate: number;
        repeat: number;
      }> = [
        { key: `${animationPrefix}-idle-front`, frames: [0], frameRate: 1, repeat: -1 },
        { key: `${animationPrefix}-idle-right`, frames: [3], frameRate: 1, repeat: -1 },
        { key: `${animationPrefix}-idle-left`, frames: [4], frameRate: 1, repeat: -1 },
        { key: `${animationPrefix}-idle-back`, frames: [5], frameRate: 1, repeat: -1 },
        { key: `${animationPrefix}-walk-front`, frames: [0, 7], frameRate: 5, repeat: -1 },
        { key: `${animationPrefix}-walk-right`, frames: [2, 3], frameRate: 5, repeat: -1 },
        { key: `${animationPrefix}-walk-left`, frames: [1, 4], frameRate: 5, repeat: -1 },
        { key: `${animationPrefix}-walk-back`, frames: [5, 6], frameRate: 5, repeat: -1 },
        { key: `${animationPrefix}-attack`, frames: [8, 9], frameRate: 8, repeat: 0 }
      ];

      animations.forEach(({ key, frames, frameRate, repeat }) => {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(textureKey, { frames }),
          frameRate,
          repeat
        });
      });
    });
  }

  private createVocalistAnimations() {
    if (this.anims.exists('vocalist-idle-front')) {
      return;
    }

    const animations: Array<{
      key: string;
      frames: number[];
      frameRate: number;
      repeat: number;
    }> = [
      { key: 'vocalist-idle-front', frames: [0], frameRate: 1, repeat: -1 },
      { key: 'vocalist-idle-left', frames: [1], frameRate: 1, repeat: -1 },
      { key: 'vocalist-idle-right', frames: [2], frameRate: 1, repeat: -1 },
      { key: 'vocalist-idle-back', frames: [25], frameRate: 1, repeat: -1 },
      { key: 'vocalist-sing-front', frames: [4], frameRate: 1, repeat: -1 },
      { key: 'vocalist-sing-left', frames: [5], frameRate: 1, repeat: -1 },
      { key: 'vocalist-sing-right', frames: [6], frameRate: 1, repeat: -1 },
      { key: 'vocalist-mic-stand-front', frames: [7], frameRate: 1, repeat: -1 },
      { key: 'vocalist-mic-stand-left', frames: [8], frameRate: 1, repeat: -1 },
      { key: 'vocalist-hype-crowd', frames: [9], frameRate: 1, repeat: -1 },
      { key: 'vocalist-pointing-mic-out', frames: [11], frameRate: 1, repeat: -1 },
      { key: 'vocalist-scream-power-vocal', frames: [12], frameRate: 1, repeat: -1 },
      { key: 'vocalist-crouch-sing', frames: [13], frameRate: 1, repeat: -1 },
      { key: 'vocalist-kneel-sing', frames: [14], frameRate: 1, repeat: -1 },
      { key: 'vocalist-headbang', frames: [15, 16], frameRate: 6, repeat: -1 },
      { key: 'vocalist-jump-pose', frames: [17], frameRate: 1, repeat: -1 },
      { key: 'vocalist-lean-back-sing', frames: [18], frameRate: 1, repeat: -1 },
      { key: 'vocalist-walk-front', frames: [19, 20], frameRate: 6, repeat: -1 },
      { key: 'vocalist-walk-left', frames: [21], frameRate: 1, repeat: -1 },
      { key: 'vocalist-walk-back', frames: [25], frameRate: 1, repeat: -1 }
    ];

    animations.forEach(({ key, frames, frameRate, repeat }) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('vocalist_sheet', { frames }),
        frameRate,
        repeat
      });
    });
  }

  private createGuitaristAnimations() {
    if (this.anims.exists('guitarist-idle-front')) {
      return;
    }

    const animations: Array<{
      key: string;
      frames: number[];
      frameRate: number;
      repeat: number;
    }> = [
      { key: 'guitarist-idle-front', frames: [0], frameRate: 1, repeat: -1 },
      { key: 'guitarist-idle-right', frames: [1], frameRate: 1, repeat: -1 },
      { key: 'guitarist-idle-left', frames: [2], frameRate: 1, repeat: -1 },
      { key: 'guitarist-idle-back', frames: [3], frameRate: 1, repeat: -1 },
      { key: 'guitarist-walk-front', frames: [4, 5], frameRate: 6, repeat: -1 },
      { key: 'guitarist-walk-right', frames: [4, 5], frameRate: 6, repeat: -1 },
      { key: 'guitarist-walk-left', frames: [6, 7], frameRate: 6, repeat: -1 },
      { key: 'guitarist-walk-back', frames: [6, 7], frameRate: 6, repeat: -1 },
      { key: 'guitarist-riff-front', frames: [8, 9, 10, 11], frameRate: 6, repeat: -1 },
      { key: 'guitarist-power-riff', frames: [12, 13, 14, 15], frameRate: 7, repeat: -1 },
      { key: 'guitarist-crowd-hype', frames: [16], frameRate: 1, repeat: -1 },
      { key: 'guitarist-low-solo', frames: [17, 18, 19], frameRate: 5, repeat: -1 },
      { key: 'guitarist-jump-solo', frames: [20, 21, 22], frameRate: 6, repeat: -1 }
    ];

    animations.forEach(({ key, frames, frameRate, repeat }) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('guitarist_sheet', { frames }),
        frameRate,
        repeat
      });
    });
  }

  private createBassistAnimations() {
    if (this.anims.exists('bassist-idle-front')) {
      return;
    }

    const animations: Array<{
      key: string;
      frames: number[];
      frameRate: number;
      repeat: number;
    }> = [
      { key: 'bassist-idle-front', frames: [0], frameRate: 1, repeat: -1 },
      { key: 'bassist-idle-right', frames: [1], frameRate: 1, repeat: -1 },
      { key: 'bassist-idle-left', frames: [2], frameRate: 1, repeat: -1 },
      { key: 'bassist-idle-back', frames: [3], frameRate: 1, repeat: -1 },
      { key: 'bassist-walk-front', frames: [4, 5], frameRate: 6, repeat: -1 },
      { key: 'bassist-walk-right', frames: [4, 5], frameRate: 6, repeat: -1 },
      { key: 'bassist-walk-left', frames: [6, 7], frameRate: 6, repeat: -1 },
      { key: 'bassist-walk-back', frames: [6, 7], frameRate: 6, repeat: -1 },
      { key: 'bassist-riff-front', frames: [8, 9, 10, 11], frameRate: 6, repeat: -1 },
      { key: 'bassist-power-riff', frames: [12, 13, 14, 15], frameRate: 7, repeat: -1 },
      { key: 'bassist-crowd-hype', frames: [16], frameRate: 1, repeat: -1 },
      { key: 'bassist-low-solo', frames: [17, 18, 19], frameRate: 5, repeat: -1 },
      { key: 'bassist-jump-solo', frames: [20, 21, 22], frameRate: 6, repeat: -1 }
    ];

    animations.forEach(({ key, frames, frameRate, repeat }) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('bassist_sheet', { frames }),
        frameRate,
        repeat
      });
    });
  }

  private createDrummerAnimations() {
    if (this.anims.exists('drummer-idle')) {
      return;
    }

    const animations: Array<{
      key: string;
      frames: number[];
      frameRate: number;
      repeat: number;
    }> = [
      { key: 'drummer-idle', frames: [0, 1, 2, 3], frameRate: 5, repeat: -1 },
      { key: 'drummer-groove', frames: [4, 5, 6, 7], frameRate: 7, repeat: -1 },
      { key: 'drummer-fill', frames: [8, 9, 10, 11], frameRate: 8, repeat: -1 },
      { key: 'drummer-finale', frames: [12, 13, 14, 15], frameRate: 7, repeat: -1 }
    ];

    animations.forEach(({ key, frames, frameRate, repeat }) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('drummer_sheet', { frames }),
        frameRate,
        repeat
      });
    });
  }

  private configureVocalistBody(vocalist: Phaser.Physics.Arcade.Sprite) {
    const body = vocalist.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    body.setSize(54, 84);
    body.setOffset(77, 152);
  }

  private playVocalistAnimation(animationKey: string, flipX: boolean = false) {
    if (!this.vocalist) return;

    this.vocalist.setFlipX(flipX);
    if (this.vocalist.anims.currentAnim?.key !== animationKey || this.vocalist.flipX !== flipX) {
      this.vocalist.play(animationKey, true);
      this.vocalist.setFlipX(flipX);
    }
  }

  private configureGuitaristBody(guitarist: Phaser.Physics.Arcade.Sprite) {
    const body = guitarist.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    body.setSize(62, 80);
    body.setOffset(73, 130);
  }

  private playGuitaristAnimation(animationKey: string) {
    if (!this.guitarist) return;

    if (this.guitarist.anims.currentAnim?.key !== animationKey) {
      this.guitarist.play(animationKey, true);
    }
  }

  private configureBassistBody(bassist: Phaser.Physics.Arcade.Sprite) {
    const body = bassist.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    body.setSize(62, 80);
    body.setOffset(81, 130);
  }

  private playBassistAnimation(animationKey: string) {
    if (!this.bassist) return;

    if (this.bassist.anims.currentAnim?.key !== animationKey) {
      this.bassist.play(animationKey, true);
    }
  }

  private configureDrummerBody(drummer: Phaser.Physics.Arcade.Sprite) {
    const body = drummer.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    body.setSize(88, 64);
    body.setOffset(71, 140);
    body.setAllowGravity(false);
    body.moves = false;
  }

  private playDrummerAnimation(animationKey: string) {
    if (!this.drummer) return;

    if (this.drummer.anims.currentAnim?.key !== animationKey) {
      this.drummer.play(animationKey, true);
    }
  }

  private configureAggroCrowdBody(entity: Phaser.Physics.Arcade.Sprite) {
    const body = entity.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    const radius = 26;
    const diameter = radius * 2;
    const offsetX = Math.round((AGGRO_CROWD_FRAME_SIZE - diameter) / 2);
    const offsetY = AGGRO_CROWD_FRAME_SIZE - diameter - 10;

    body.setCircle(radius, offsetX, offsetY);
  }

  private configureNormalCrowdBody(entity: Phaser.Physics.Arcade.Sprite) {
    const body = entity.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    const radius = 28;
    const diameter = radius * 2;
    const offsetX = Math.round((NORMAL_CROWD_FRAME_SIZE - diameter) / 2);
    const offsetY = NORMAL_CROWD_FRAME_SIZE - diameter - 10;

    body.setCircle(radius, offsetX, offsetY);
  }

  private updateCrowdDepth(entity: Phaser.Physics.Arcade.Sprite) {
    const body = entity.body as Phaser.Physics.Arcade.Body | null;
    const sortY = body?.bottom ?? entity.y;
    const normalizedDepth = Phaser.Math.Clamp((sortY / GAME_HEIGHT) * (PLAYER_BASE_DEPTH - 2), 1, PLAYER_BASE_DEPTH - 1);
    entity.setDepth(normalizedDepth);
  }

  private getCrowdFacingFromVelocity(
    velocityX: number,
    velocityY: number,
    fallback: CrowdFacing = 'front'
  ): CrowdFacing {
    if (Math.abs(velocityX) < 8 && Math.abs(velocityY) < 8) {
      return fallback;
    }

    if (Math.abs(velocityX) > Math.abs(velocityY)) {
      return velocityX >= 0 ? 'right' : 'left';
    }

    return velocityY >= 0 ? 'front' : 'back';
  }

  private playAggroCrowdAnimation(
    entity: Phaser.Physics.Arcade.Sprite,
    action: 'idle' | 'walk' | 'attack',
    facing?: CrowdFacing
  ) {
    const animationPrefix = entity.getData('crowdAnimPrefix') as string | undefined;
    if (!animationPrefix) return;

    const animationKey =
      action === 'attack'
        ? `${animationPrefix}-attack`
        : `${animationPrefix}-${action}-${facing ?? 'front'}`;
    const shouldMirrorRight =
      facing === 'right' && Boolean(entity.getData('mirrorCrowdRight'));
    const currentFlipX = entity.flipX;

    if (entity.anims.currentAnim?.key !== animationKey || currentFlipX !== shouldMirrorRight) {
      entity.play(animationKey, true);
      entity.setFlipX(shouldMirrorRight);
    }
  }

  private updateAggroCrowdAnimation(
    entity: Phaser.Physics.Arcade.Sprite,
    preferredFacing?: CrowdFacing
  ) {
    if (!entity.active || !entity.getData('crowdAnimPrefix')) return;

    const attackUntil = (entity.getData('attackUntil') as number | undefined) ?? 0;
    if (this.time.now < attackUntil) {
      return;
    }

    const body = entity.body as Phaser.Physics.Arcade.Body | null;
    const previousFacing = (entity.getData('crowdFacing') as CrowdFacing | undefined) ?? 'front';
    const facing =
      preferredFacing ??
      this.getCrowdFacingFromVelocity(body?.velocity.x ?? 0, body?.velocity.y ?? 0, previousFacing);
    const isMoving = body ? body.speed > 20 : false;

    entity.setData('crowdFacing', facing);
    this.playAggroCrowdAnimation(entity, isMoving ? 'walk' : 'idle', facing);
  }

  private getRandomDrummerAnimation() {
    return Phaser.Utils.Array.GetRandom([
      'drummer-idle',
      'drummer-idle',
      'drummer-groove',
      'drummer-groove',
      'drummer-fill',
      'drummer-finale'
    ]);
  }

  private resetDrummerState(time: number) {
    if (!this.drummer?.active) return;

    this.drummer.setPosition(DRUMMER_HOME_POSITION.x, DRUMMER_HOME_POSITION.y);
    this.drummer.setVelocity(0, 0);
    if (!this.drummer.getData('onCooldown')) {
        this.drummer.setAlpha(1);
    }
    this.drummer.setData('jammed', false);
    this.drummer.setData('spawnX', DRUMMER_HOME_POSITION.x);
    this.drummer.setData('spawnY', DRUMMER_HOME_POSITION.y);
    this.drummer.setData('stateUntil', 0);
    this.startDrummerPerformance(time);
  }

  private startDrummerPerformance(time: number) {
    if (!this.drummer?.active) return;

    this.drummer.setVelocity(0, 0);
    this.drummer.setData(
      'stateUntil',
      time + Phaser.Math.Between(DRUMMER_PERFORMANCE_MIN_MS, DRUMMER_PERFORMANCE_MAX_MS)
    );
    this.playDrummerAnimation(this.getRandomDrummerAnimation());
  }

  private updateDrummerAI(time: number) {
    if (!this.drummer?.active || this.drummer.getData('jammed')) {
      return;
    }

    this.drummer.setPosition(DRUMMER_HOME_POSITION.x, DRUMMER_HOME_POSITION.y);
    this.drummer.setVelocity(0, 0);

    const stateUntil = (this.drummer.getData('stateUntil') as number | undefined) ?? 0;
    if (time >= stateUntil) {
      this.startDrummerPerformance(time);
    }
  }

  private getNearbyAvailableMusician() {
    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let nearestDistance = STAGE_INTERACTION_RADIUS;

    this.musiciansGroup.getChildren().forEach((child: any) => {
      const musician = child as Phaser.Physics.Arcade.Sprite;
      if (musician.getData('jammed') || musician.getData('onCooldown')) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        musician.x,
        musician.y
      );

      if (distance <= nearestDistance) {
        nearest = musician;
        nearestDistance = distance;
      }
    });

    return nearest;
  }

  private getVocalistHomeAnimation(): { key: string; flipX?: boolean } {
    const homeAnimations = [
      { key: 'vocalist-mic-stand-front' },
      { key: 'vocalist-mic-stand-front' },
      { key: 'vocalist-mic-stand-front' },
      { key: 'vocalist-mic-stand-front' },
      { key: 'vocalist-mic-stand-front' },
      { key: 'vocalist-mic-stand-front' },
      { key: 'vocalist-sing-front' },
      { key: 'vocalist-sing-front' },
      { key: 'vocalist-idle-front' },
      { key: 'vocalist-mic-stand-left' },
      { key: 'vocalist-mic-stand-left', flipX: true },
      { key: 'vocalist-sing-left' },
      { key: 'vocalist-sing-right' }
    ];

    return Phaser.Utils.Array.GetRandom(homeAnimations);
  }

  private getVocalistAwayAnimation(): { key: string; flipX?: boolean } {
    const awayAnimations = [
      { key: 'vocalist-idle-front' },
      { key: 'vocalist-idle-left' },
      { key: 'vocalist-idle-right' },
      { key: 'vocalist-sing-left' },
      { key: 'vocalist-sing-right' },
      { key: 'vocalist-hype-crowd' },
      { key: 'vocalist-pointing-mic-out' },
      { key: 'vocalist-scream-power-vocal' },
      { key: 'vocalist-crouch-sing' },
      { key: 'vocalist-kneel-sing' },
      { key: 'vocalist-headbang' },
      { key: 'vocalist-jump-pose' },
      { key: 'vocalist-lean-back-sing' }
    ];

    return Phaser.Utils.Array.GetRandom(awayAnimations);
  }

  private getRandomPerformanceDuration() {
    return Phaser.Math.Between(VOCALIST_PERFORMANCE_MIN_MS, VOCALIST_PERFORMANCE_MAX_MS);
  }

  private getRandomGuitaristPerformanceDuration() {
    return Phaser.Math.Between(GUITARIST_PERFORMANCE_MIN_MS, GUITARIST_PERFORMANCE_MAX_MS);
  }

  private getRandomBassistPerformanceDuration() {
    return Phaser.Math.Between(BASSIST_PERFORMANCE_MIN_MS, BASSIST_PERFORMANCE_MAX_MS);
  }

  private isVocalistAtHome() {
    return (
      Phaser.Math.Distance.Between(
        this.vocalist.x,
        this.vocalist.y,
        VOCALIST_HOME_POSITION.x,
        VOCALIST_HOME_POSITION.y
      ) <= VOCALIST_TARGET_REACHED_RADIUS
    );
  }

  private isGuitaristAtHome() {
    return (
      Phaser.Math.Distance.Between(
        this.guitarist.x,
        this.guitarist.y,
        GUITARIST_HOME_POSITION.x,
        GUITARIST_HOME_POSITION.y
      ) <= GUITARIST_TARGET_REACHED_RADIUS
    );
  }

  private isBassistAtHome() {
    return (
      Phaser.Math.Distance.Between(
        this.bassist.x,
        this.bassist.y,
        BASSIST_HOME_POSITION.x,
        BASSIST_HOME_POSITION.y
      ) <= BASSIST_TARGET_REACHED_RADIUS
    );
  }

  private startVocalistPerformance(time: number, atHome: boolean) {
    const performance = atHome
      ? this.getVocalistHomeAnimation()
      : this.getVocalistAwayAnimation();

    this.vocalist.setVelocity(0, 0);
    this.vocalist.setData('state', 'performing');
    this.vocalist.setData('stateUntil', time + this.getRandomPerformanceDuration());
    this.playVocalistAnimation(performance.key, performance.flipX ?? false);
  }

  private moveVocalistTo(targetX: number, targetY: number) {
    this.vocalist.setData('state', 'moving');
    this.vocalist.setData('targetX', targetX);
    this.vocalist.setData('targetY', targetY);
  }

  private getRandomGuitaristPerformance() {
    return Phaser.Utils.Array.GetRandom([
      'guitarist-riff-front',
      'guitarist-riff-front',
      'guitarist-power-riff',
      'guitarist-power-riff',
      'guitarist-low-solo',
      'guitarist-jump-solo',
      'guitarist-idle-front'
    ]);
  }

  private startGuitaristPerformance(time: number, atHome: boolean) {
    const animationKey = atHome && Math.random() < 0.2
      ? Phaser.Utils.Array.GetRandom([
          'guitarist-idle-front',
          'guitarist-idle-left',
          'guitarist-idle-right'
        ])
      : this.getRandomGuitaristPerformance();

    this.guitarist.setVelocity(0, 0);
    this.guitarist.setData('state', 'performing');
    this.guitarist.setData('stateUntil', time + this.getRandomGuitaristPerformanceDuration());
    this.playGuitaristAnimation(animationKey);
  }

  private moveGuitaristTo(targetX: number, targetY: number) {
    this.guitarist.setData('state', 'moving');
    this.guitarist.setData('targetX', targetX);
    this.guitarist.setData('targetY', targetY);
  }

  private getRandomBassistPerformance() {
    return Phaser.Utils.Array.GetRandom([
      'bassist-riff-front',
      'bassist-riff-front',
      'bassist-power-riff',
      'bassist-power-riff',
      'bassist-low-solo',
      'bassist-jump-solo',
      'bassist-idle-front'
    ]);
  }

  private startBassistPerformance(time: number, atHome: boolean) {
    const animationKey = atHome && Math.random() < 0.2
      ? Phaser.Utils.Array.GetRandom([
          'bassist-idle-front',
          'bassist-idle-left',
          'bassist-idle-right'
        ])
      : this.getRandomBassistPerformance();

    this.bassist.setVelocity(0, 0);
    this.bassist.setData('state', 'performing');
    this.bassist.setData('stateUntil', time + this.getRandomBassistPerformanceDuration());
    this.playBassistAnimation(animationKey);
  }

  private moveBassistTo(targetX: number, targetY: number) {
    this.bassist.setData('state', 'moving');
    this.bassist.setData('targetX', targetX);
    this.bassist.setData('targetY', targetY);
  }

  private getRandomVocalistStageTarget() {
    const minX = Phaser.Math.Clamp(
      VOCALIST_HOME_POSITION.x - VOCALIST_WANDER_X_RANGE,
      42,
      GAME_WIDTH - 42
    );
    const maxX = Phaser.Math.Clamp(
      VOCALIST_HOME_POSITION.x + VOCALIST_WANDER_X_RANGE,
      42,
      GAME_WIDTH - 42
    );
    const minY = Phaser.Math.Clamp(
      VOCALIST_HOME_POSITION.y - VOCALIST_WANDER_UP_RANGE,
      28,
      STAGE_BOTTOM_Y - 18
    );
    const maxY = Phaser.Math.Clamp(
      VOCALIST_HOME_POSITION.y + VOCALIST_WANDER_DOWN_RANGE,
      28,
      STAGE_BOTTOM_Y - 18
    );

    for (let attempt = 0; attempt < 10; attempt++) {
      const x = Phaser.Math.Between(minX, maxX);
      const y = Phaser.Math.Between(minY, maxY);
      if (
        Phaser.Math.Distance.Between(x, y, VOCALIST_HOME_POSITION.x, VOCALIST_HOME_POSITION.y) >
        28
      ) {
        return { x, y };
      }
    }

    return {
      x: Phaser.Math.Between(minX, maxX),
      y: Phaser.Math.Between(minY, maxY)
    };
  }

  private getRandomGuitaristStageTarget() {
    const visitStageEdge = Math.random() < GUITARIST_EDGE_VISIT_CHANCE;
    if (visitStageEdge) {
      return {
        x: Phaser.Math.Between(52, GAME_WIDTH - 52),
        y: Phaser.Math.Between(STAGE_BOTTOM_Y - 34, STAGE_BOTTOM_Y - 18)
      };
    }

    const minX = Phaser.Math.Clamp(
      GUITARIST_HOME_POSITION.x - GUITARIST_WANDER_X_RANGE,
      42,
      GAME_WIDTH - 42
    );
    const maxX = Phaser.Math.Clamp(
      GUITARIST_HOME_POSITION.x + GUITARIST_WANDER_X_RANGE,
      42,
      GAME_WIDTH - 42
    );
    const minY = Phaser.Math.Clamp(
      GUITARIST_HOME_POSITION.y - GUITARIST_WANDER_UP_RANGE,
      34,
      STAGE_BOTTOM_Y - 18
    );
    const maxY = Phaser.Math.Clamp(
      GUITARIST_HOME_POSITION.y + GUITARIST_WANDER_DOWN_RANGE,
      34,
      STAGE_BOTTOM_Y - 18
    );

    for (let attempt = 0; attempt < 10; attempt++) {
      const x = Phaser.Math.Between(minX, maxX);
      const y = Phaser.Math.Between(minY, maxY);
      if (
        Phaser.Math.Distance.Between(x, y, GUITARIST_HOME_POSITION.x, GUITARIST_HOME_POSITION.y) >
        24
      ) {
        return { x, y };
      }
    }

    return {
      x: Phaser.Math.Between(minX, maxX),
      y: Phaser.Math.Between(minY, maxY)
    };
  }

  private getRandomBassistStageTarget() {
    const visitStageEdge = Math.random() < BASSIST_EDGE_VISIT_CHANCE;
    if (visitStageEdge) {
      return {
        x: Phaser.Math.Between(52, GAME_WIDTH - 52),
        y: Phaser.Math.Between(STAGE_BOTTOM_Y - 34, STAGE_BOTTOM_Y - 18)
      };
    }

    const minX = Phaser.Math.Clamp(
      BASSIST_HOME_POSITION.x - BASSIST_WANDER_X_RANGE,
      42,
      GAME_WIDTH - 42
    );
    const maxX = Phaser.Math.Clamp(
      BASSIST_HOME_POSITION.x + BASSIST_WANDER_X_RANGE,
      42,
      GAME_WIDTH - 42
    );
    const minY = Phaser.Math.Clamp(
      BASSIST_HOME_POSITION.y - BASSIST_WANDER_UP_RANGE,
      34,
      STAGE_BOTTOM_Y - 18
    );
    const maxY = Phaser.Math.Clamp(
      BASSIST_HOME_POSITION.y + BASSIST_WANDER_DOWN_RANGE,
      34,
      STAGE_BOTTOM_Y - 18
    );

    for (let attempt = 0; attempt < 10; attempt++) {
      const x = Phaser.Math.Between(minX, maxX);
      const y = Phaser.Math.Between(minY, maxY);
      if (
        Phaser.Math.Distance.Between(x, y, BASSIST_HOME_POSITION.x, BASSIST_HOME_POSITION.y) >
        24
      ) {
        return { x, y };
      }
    }

    return {
      x: Phaser.Math.Between(minX, maxX),
      y: Phaser.Math.Between(minY, maxY)
    };
  }

  private chooseNextVocalistAction(time: number) {
    const atHome = this.isVocalistAtHome();

    if (atHome) {
      if (Math.random() < VOCALIST_HOME_STAY_CHANCE) {
        this.startVocalistPerformance(time, true);
      } else {
        const nextSpot = this.getRandomVocalistStageTarget();
        this.moveVocalistTo(nextSpot.x, nextSpot.y);
      }
      return;
    }

    if (Math.random() < VOCALIST_RETURN_HOME_CHANCE) {
      this.moveVocalistTo(VOCALIST_HOME_POSITION.x, VOCALIST_HOME_POSITION.y);
      return;
    }

    if (Math.random() < 0.5) {
      this.startVocalistPerformance(time, false);
      return;
    }

    const nextSpot = this.getRandomVocalistStageTarget();
    this.moveVocalistTo(nextSpot.x, nextSpot.y);
  }

  private chooseNextGuitaristAction(time: number) {
    const atHome = this.isGuitaristAtHome();

    if (atHome) {
      if (Math.random() < GUITARIST_HOME_STAY_CHANCE) {
        this.startGuitaristPerformance(time, true);
      } else {
        const nextSpot = this.getRandomGuitaristStageTarget();
        this.moveGuitaristTo(nextSpot.x, nextSpot.y);
      }
      return;
    }

    if (Math.random() < GUITARIST_RETURN_HOME_CHANCE) {
      this.moveGuitaristTo(GUITARIST_HOME_POSITION.x, GUITARIST_HOME_POSITION.y);
      return;
    }

    if (Math.random() < 0.65) {
      this.startGuitaristPerformance(time, false);
      return;
    }

    const nextSpot = this.getRandomGuitaristStageTarget();
    this.moveGuitaristTo(nextSpot.x, nextSpot.y);
  }

  private chooseNextBassistAction(time: number) {
    const atHome = this.isBassistAtHome();

    if (atHome) {
      if (Math.random() < BASSIST_HOME_STAY_CHANCE) {
        this.startBassistPerformance(time, true);
      } else {
        const nextSpot = this.getRandomBassistStageTarget();
        this.moveBassistTo(nextSpot.x, nextSpot.y);
      }
      return;
    }

    if (Math.random() < BASSIST_RETURN_HOME_CHANCE) {
      this.moveBassistTo(BASSIST_HOME_POSITION.x, BASSIST_HOME_POSITION.y);
      return;
    }

    if (Math.random() < 0.65) {
      this.startBassistPerformance(time, false);
      return;
    }

    const nextSpot = this.getRandomBassistStageTarget();
    this.moveBassistTo(nextSpot.x, nextSpot.y);
  }

  private resetVocalistState(time: number) {
    if (!this.vocalist) return;

    this.vocalist.setPosition(VOCALIST_HOME_POSITION.x, VOCALIST_HOME_POSITION.y);
    this.vocalist.setVelocity(0, 0);
    if (!this.vocalist.getData('onCooldown')) {
        this.vocalist.setAlpha(1);
    }
    this.vocalist.setData('jammed', false);
    this.vocalist.setData('facing', 'front');
    this.vocalist.setData('state', 'performing');
    this.vocalist.setData('targetX', VOCALIST_HOME_POSITION.x);
    this.vocalist.setData('targetY', VOCALIST_HOME_POSITION.y);
    this.startVocalistPerformance(time, true);
  }

  private resetGuitaristState(time: number) {
    if (!this.guitarist) return;

    this.guitarist.setPosition(GUITARIST_HOME_POSITION.x, GUITARIST_HOME_POSITION.y);
    this.guitarist.setVelocity(0, 0);
    if (!this.guitarist.getData('onCooldown')) {
      this.guitarist.setAlpha(1);
    }
    this.guitarist.setData('jammed', false);
    this.guitarist.setData('facing', 'front');
    this.guitarist.setData('state', 'performing');
    this.guitarist.setData('targetX', GUITARIST_HOME_POSITION.x);
    this.guitarist.setData('targetY', GUITARIST_HOME_POSITION.y);
    this.startGuitaristPerformance(time, true);
  }

  private resetBassistState(time: number) {
    if (!this.bassist) return;

    this.bassist.setPosition(BASSIST_HOME_POSITION.x, BASSIST_HOME_POSITION.y);
    this.bassist.setVelocity(0, 0);
    if (!this.bassist.getData('onCooldown')) {
      this.bassist.setAlpha(1);
    }
    this.bassist.setData('jammed', false);
    this.bassist.setData('facing', 'front');
    this.bassist.setData('state', 'performing');
    this.bassist.setData('targetX', BASSIST_HOME_POSITION.x);
    this.bassist.setData('targetY', BASSIST_HOME_POSITION.y);
    this.startBassistPerformance(time, true);
  }

  private configureRoadieBody(roadie: Phaser.Physics.Arcade.Sprite) {
    const body = roadie.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    body.setSize(54, 78);
    body.setOffset(85, 176);
  }

  private resetRoadieToHome(roadie: Phaser.Physics.Arcade.Sprite, index: number) {
    const homePosition = ROADIE_HOME_POSITIONS[index];
    if (!homePosition) return;

    roadie.setPosition(homePosition.x, homePosition.y);
    roadie.setDepth(ROADIE_DEPTH);
    roadie.setVelocity(0, 0);
    roadie.setData('homeIndex', index);
    roadie.setData('homeX', homePosition.x);
    roadie.setData('homeY', homePosition.y);
    roadie.setData('idleSide', homePosition.idleSide);
    roadie.setData('facing', homePosition.idleSide);
    roadie.setData('hasLeftHome', false);
    roadie.setData('pushUntil', 0);
    roadie.setData('pushDirection', 'forward');
    this.playRoadieAnimation(roadie, `roadie-idle-${homePosition.idleSide}`);
  }

  private advanceRoadieHome(roadie: Phaser.Physics.Arcade.Sprite) {
    const currentIndex = (roadie.getData('homeIndex') as number | undefined) ?? 0;
    const nextIndex = (currentIndex + 1) % ROADIE_HOME_POSITIONS.length;
    const nextHome = ROADIE_HOME_POSITIONS[nextIndex];

    roadie.setData('homeIndex', nextIndex);
    roadie.setData('homeX', nextHome.x);
    roadie.setData('homeY', nextHome.y);
    roadie.setData('idleSide', nextHome.idleSide);
  }

  private playRoadieAnimation(roadie: Phaser.Physics.Arcade.Sprite, animationKey: string) {
    if (roadie.anims.currentAnim?.key !== animationKey) {
      roadie.play(animationKey, true);
    }
  }

  private updateRoadieAnimation(roadie: Phaser.Physics.Arcade.Sprite) {
    const pushUntil = (roadie.getData('pushUntil') as number | undefined) ?? 0;
    if (this.time.now < pushUntil) {
      const pushDirection =
        (roadie.getData('pushDirection') as RoadiePushDirection | undefined) ?? 'forward';
      this.playRoadieAnimation(roadie, `roadie-push-${pushDirection}`);
      return;
    }

    const velocity = roadie.body?.velocity;
    const speedX = velocity?.x ?? 0;
    const speedY = velocity?.y ?? 0;
    const isMoving = Math.abs(speedX) > 5 || Math.abs(speedY) > 5;
    const homeX = (roadie.getData('homeX') as number | undefined) ?? roadie.x;
    const homeY = (roadie.getData('homeY') as number | undefined) ?? roadie.y;
    const idleSide = (roadie.getData('idleSide') as RoadieIdleSide | undefined) ?? 'left';

    let facing = (roadie.getData('facing') as RoadieFacing | undefined) ?? 'front';
    if (Math.abs(speedX) > Math.abs(speedY)) {
      if (speedX > 5) facing = 'right';
      else if (speedX < -5) facing = 'left';
    } else {
      if (speedY > 5) facing = 'front';
      else if (speedY < -5) facing = 'back';
    }
    roadie.setData('facing', facing);

    const isAtHome = Phaser.Math.Distance.Between(roadie.x, roadie.y, homeX, homeY) <= 10;
    if (!isMoving && isAtHome) {
      this.playRoadieAnimation(roadie, `roadie-idle-${idleSide}`);
      return;
    }

    this.playRoadieAnimation(roadie, `roadie-run-${facing}`);
  }

  private triggerRoadiePush(roadie: Phaser.Physics.Arcade.Sprite) {
    const deltaX = this.player.x - roadie.x;
    const deltaY = this.player.y - roadie.y;

    let pushDirection: RoadiePushDirection = 'forward';
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 18) {
      pushDirection = deltaX > 0 ? 'right' : 'left';
    }

    roadie.setVelocity(0, 0);
    roadie.setData('pushDirection', pushDirection);
    roadie.setData('pushUntil', this.time.now + 260);
    this.updateRoadieAnimation(roadie);
  }

  private spawnRoadies() {
    const startIndex = 0;
    const startPosition = ROADIE_HOME_POSITIONS[startIndex];
    const frame = startPosition.idleSide === 'left' ? 1 : 0;
    const roadie = this.roadiesGroup.create(
      startPosition.x,
      startPosition.y,
      'roadie_sheet',
      frame
    ) as Phaser.Physics.Arcade.Sprite;

    roadie.setScale(ROADIE_DISPLAY_SCALE);
    roadie.setCollideWorldBounds(true);
    roadie.setDepth(ROADIE_DEPTH);
    this.configureRoadieBody(roadie);
    this.resetRoadieToHome(roadie, startIndex);
  }

  private spawnMusicians() {
    const band = [
      { x: VOCALIST_HOME_POSITION.x, y: VOCALIST_HOME_POSITION.y, key: 'vocalist_sheet', type: 'vocal', frame: 7 },
      { x: DRUMMER_HOME_POSITION.x, y: DRUMMER_HOME_POSITION.y, key: 'drummer_sheet', type: 'drum', frame: 0 },
      { x: GUITARIST_HOME_POSITION.x, y: GUITARIST_HOME_POSITION.y, key: 'guitarist_sheet', type: 'guitar', frame: 0 },
      { x: BASSIST_HOME_POSITION.x, y: BASSIST_HOME_POSITION.y, key: 'bassist_sheet', type: 'bass', frame: 0 }
    ];
    
    band.forEach(m => {
      const musician = this.musiciansGroup.create(m.x, m.y, m.key, m.frame ?? 0) as Phaser.Physics.Arcade.Sprite;
      musician.setData('type', m.type);
      musician.setData('spawnX', m.x);
      musician.setData('spawnY', m.y);
      musician.setCollideWorldBounds(true);

      if (m.type === 'vocal') {
        this.vocalist = musician;
        musician.setScale(VOCALIST_DISPLAY_SCALE);
        musician.setDepth(VOCALIST_DEPTH);
        musician.setPushable(false);
        this.configureVocalistBody(musician);
        this.resetVocalistState(this.time.now);
      } else if (m.type === 'guitar') {
        this.guitarist = musician;
        musician.setScale(GUITARIST_DISPLAY_SCALE);
        musician.setDepth(GUITARIST_DEPTH);
        musician.setPushable(false);
        this.configureGuitaristBody(musician);
        this.resetGuitaristState(this.time.now);
      } else if (m.type === 'drum') {
        this.drummer = musician;
        musician.setScale(DRUMMER_DISPLAY_SCALE);
        musician.setDepth(DRUMMER_DEPTH);
        musician.setImmovable(true);
        musician.setPushable(false);
        this.configureDrummerBody(musician);
        this.resetDrummerState(this.time.now);
      } else if (m.type === 'bass') {
        this.bassist = musician;
        musician.setScale(BASSIST_DISPLAY_SCALE);
        musician.setDepth(BASSIST_DEPTH);
        musician.setPushable(false);
        this.configureBassistBody(musician);
        this.resetBassistState(this.time.now);
      }
    });
  }

  private createCrowdMember(
    group: Phaser.Physics.Arcade.Group,
    x: number,
    y: number,
    isAggressive: boolean,
    lineMover: boolean = false
  ) {
    const normalVariants = [...NORMAL_CROWD_VARIANTS];
    const aggroVariants = [...AGGRO_CROWD_VARIANTS];
    const normalVariant = !isAggressive
      ? (Phaser.Utils.Array.GetRandom(normalVariants) as (typeof NORMAL_CROWD_VARIANTS)[number])
      : null;
    const aggroVariant = isAggressive
      ? (Phaser.Utils.Array.GetRandom(aggroVariants) as (typeof AGGRO_CROWD_VARIANTS)[number])
      : null;
    const textureKey = aggroVariant ? aggroVariant.textureKey : 'crowd_normal_sheet';
    const entity = group.create(x, y, textureKey) as Phaser.Physics.Arcade.Sprite;

    entity.setCollideWorldBounds(!lineMover);
    entity.setBounce(this.physicsBounce);
    entity.setDrag(lineMover ? 0 : 50);
    entity.setData('isAggressive', isAggressive);
    entity.setData('jiggleOffsetX', Phaser.Math.Between(0, 1000));
    entity.setData('pushedUntil', 0);
    entity.setData('nextAttackAt', 0);
    entity.setData('attackUntil', 0);
    entity.setData('crowdFacing', 'front');
    entity.setData('mirrorCrowdRight', !isAggressive);

    if (!isAggressive && normalVariant) {
      entity.setScale(NORMAL_CROWD_DISPLAY_SCALE);
      entity.setData('crowdAnimPrefix', normalVariant.animationPrefix);
      this.configureNormalCrowdBody(entity);
      this.playAggroCrowdAnimation(entity, 'idle', 'front');
      this.updateCrowdDepth(entity);
      return entity;
    }

    entity.setScale(AGGRO_CROWD_DISPLAY_SCALE);
    entity.setData('crowdAnimPrefix', aggroVariant?.animationPrefix);
    this.configureAggroCrowdBody(entity);
    this.playAggroCrowdAnimation(entity, 'idle', 'front');
    this.updateCrowdDepth(entity);
    return entity;
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
      this.createCrowdMember(this.crowdGroup, randomX, randomY, isAggressive);
    }
  }

  private queueExtraCrowdReinforcements() {
    if (this.extraCrowdTriggered) return;

    this.extraCrowdTriggered = true;
    this.extraCrowdTotal = Math.max(1, Math.round(this.publicNumber * 0.6));
    this.extraCrowdPending = this.extraCrowdTotal;
    this.lastExtraCrowdSpawnTime = this.time.now;
  }

  private spawnQueuedExtraCrowd(time: number) {
    if (this.extraCrowdPending <= 0) return;
    if (time < this.lastExtraCrowdSpawnTime + 180) return;

    this.lastExtraCrowdSpawnTime = time;

    const minY = GAME_HEIGHT * 0.82;
    const maxY = GAME_HEIGHT - LANE_HEIGHT;
    const spawnCount = Math.min(this.extraCrowdPending, Phaser.Math.Between(1, 2));

    for (let index = 0; index < spawnCount; index++) {
      const randomY = Phaser.Math.FloatBetween(minY, maxY);
      const randomX = Phaser.Math.Between(18, GAME_WIDTH - 18);
      const entity = this.createCrowdMember(this.crowdGroup, randomX, randomY, false);
      entity.setData('isReinforcement', true);
      entity.setAlpha(0);
      entity.setScale(0.3);

      this.tweens.add({
        targets: entity,
        alpha: 1,
        scaleX: NORMAL_CROWD_DISPLAY_SCALE,
        scaleY: NORMAL_CROWD_DISPLAY_SCALE,
        duration: 260,
        ease: 'Sine.easeOut'
      });
    }

    this.extraCrowdPending -= spawnCount;
  }

  private resetGameVariables() {
    this.hype = 0;
    this.lives = 6;
    if (this.livesText) this.updateLivesDisplay();
    this.musicTime = 0;
    this.currentEventIndex = 0;
    this.isDiving = false;
    this.isPerforming = false;
    this.stageEntryTime = 0;
    this.playerFacing = 'front';
    this.playerSpecialAnimation = null;
    this.playerAggroInvulnerableUntil = 0;
    this.aggroHitCount = 0;
    this.extraCrowdPending = 0;
    this.extraCrowdTotal = 0;
    this.extraCrowdTriggered = false;
    this.lastExtraCrowdSpawnTime = 0;
    
    this.pushForce = -30;
    this.jostleForce = 50;
    this.physicsBounce = 0.4;
    this.aggressiveChance = 0.2;
    this.lineSpawnRate = 1200;
    this.lineBaseSpeed = 100;
    this.lastLineSpawnTime = 0;
    
    this.crowdGroup.getChildren().forEach((child: any) => child.setBounce(this.physicsBounce));
    this.lineCrowdGroup.clear(true, true);
    this.crowdGroup.getChildren().forEach((child: any) => {
      if (child.getData('isReinforcement')) {
        child.destroy();
      }
    });
    
    this.updateHype(0);
    this.player.setPosition(GAME_WIDTH / 2, SPAWN_Y);
    this.player.setVelocity(0, 0);
    this.player.setAlpha(1);
    this.player.setRotation(0);
    this.setPlayerCrowdSurfMode(false);
    this.configurePlayerBody();
    this.playPlayerAnimation('player-idle-front');
    
    const minY = SECURITY_BOTTOM_Y + 30; 
    const maxY = GAME_HEIGHT - LANE_HEIGHT;
    this.crowdGroup.getChildren().forEach((child: any) => {
      const bias = Math.pow(Math.random(), 2);
      child.y = minY + bias * (maxY - minY);
      child.x = Phaser.Math.Between(10, GAME_WIDTH - 10);
      child.setVelocity(0, 0);
      child.setAcceleration(0, 0);
      child.setData('pushedUntil', 0);
      child.setData('nextAttackAt', 0);
      child.setData('attackUntil', 0);
      if (child.getData('crowdAnimPrefix')) {
        child.setData('crowdFacing', 'front');
        this.playAggroCrowdAnimation(child as Phaser.Physics.Arcade.Sprite, 'idle', 'front');
      }
      this.updateCrowdDepth(child as Phaser.Physics.Arcade.Sprite);
    });

    this.securityBarrierGroup.getChildren().forEach((child: any) => {
      child.setData('isBroken', false);
      child.setTexture('rail');
      if (child.body) {
          child.body.checkCollision.none = false;
          child.setVelocity(0, 0); // Reset in case it was pushed
      }
    });

    this.securityChaseGroup.getChildren().forEach((child: any) => {
      child.setData('state', 'patrol');
      child.setData('targetRail', null);
      child.setPosition(Phaser.Math.Between(50, GAME_WIDTH - 50), Phaser.Math.Between(170, 230));
    });
    this.roadiesGroup.getChildren().forEach((child: any, index: number) => {
      this.resetRoadieToHome(child as Phaser.Physics.Arcade.Sprite, index % ROADIE_HOME_POSITIONS.length);
    });

    this.musiciansGroup.getChildren().forEach((child: any) => {
      const musician = child as Phaser.Physics.Arcade.Sprite;
      const type = musician.getData('type');

      musician.setData('jammed', false);
      musician.setData('onCooldown', false);
      musician.setAlpha(1);
      musician.setPosition(musician.getData('spawnX'), musician.getData('spawnY'));

      if (type === 'vocal') musician.setDepth(VOCALIST_DEPTH);
      else if (type === 'guitar') musician.setDepth(GUITARIST_DEPTH);
      else if (type === 'drum') musician.setDepth(DRUMMER_DEPTH);
      else if (type === 'bass') musician.setDepth(BASSIST_DEPTH);
    });

    this.resetVocalistState(this.time.now);
    this.resetGuitaristState(this.time.now);
    this.resetBassistState(this.time.now);
    this.resetDrummerState(this.time.now);
  }

  update(time: number, delta: number) {
    if (this.isDiving) return;

    this.musicTime += delta / 1000;
    this.processBeatEvents();

    if (!this.isPerforming) {
      this.handlePlayerMovement();
    }

    this.updatePlayerAnimation();
    this.updateVocalistAI(time);
    this.updateGuitaristAI(time);
    this.updateBassistAI(time);
    this.updateDrummerAI(time);
    
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
        const nearbyMusician = this.getNearbyAvailableMusician();

        if (nearbyMusician) {
          this.performBonusAction(nearbyMusician);
        } else {
          this.executeStageDive(false);
        }
      }
    } else if (this.player.y >= STAGE_BOTTOM_Y) {
      this.stageEntryTime = 0;
      
      // Spacebar in the crowd = MOSH PUSH
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.performCrowdPush();
      }
    }

    this.updateCrowdAI(time);
    this.spawnQueuedExtraCrowd(time);
    this.updateSecurityAI();
    this.updateRoadiesAI(time);
    this.spawnLineCrowd(time);
    this.updateLineCrowd();
    
    // Spring physics for rails so they can only be pushed a little bit
    this.securityBarrierGroup.getChildren().forEach((child: any) => {
      const r = child as Phaser.Physics.Arcade.Sprite;
      if (!r.getData('isBroken')) {
        const sx = r.getData('startX');
        const sy = r.getData('startY');
        r.x += (sx - r.x) * 0.1; // Spring back to original X
        r.y += (sy - r.y) * 0.1; // Spring back to original Y
        if (r.body) {
            r.body.velocity.x *= 0.8; // Dampen velocity
            r.body.velocity.y *= 0.8;
        }
      }
    });
  }

  private performCrowdPush() {
    const pushRadius = 40;
    const pushDistance = 20;
    let pushed = 0;
    
    const allCrowd = [...this.crowdGroup.getChildren(), ...this.lineCrowdGroup.getChildren()];
    allCrowd.forEach((child: any) => {
      const c = child as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
      if (dist < pushRadius) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, c.x, c.y);
        const targetX = c.x + Math.cos(angle) * pushDistance;
        const targetY = c.y + Math.sin(angle) * pushDistance;
        
        // Mark as pushed so AI skips it
        c.setData('pushedUntil', this.time.now + 800);
        
        this.tweens.add({
          targets: c,
          x: targetX,
          y: targetY,
          duration: 400,
          ease: 'Power2'
        });
        pushed++;
      }
    });
    
    if (pushed > 0) {
      this.cameras.main.shake(80, 0.005);
      this.updateHype(this.hype + pushed * 2);
      
      // Visual flash
      const ring = this.add.circle(this.player.x, this.player.y, 10, 0x00ffff, 0.5).setDepth(150);
      this.tweens.add({
        targets: ring,
        radius: pushRadius,
        alpha: 0,
        duration: 300,
        onComplete: () => ring.destroy()
      });
    }
  }

  private performBonusAction(musician: Phaser.Physics.Arcade.Sprite) {
    this.isPerforming = true;
    this.player.setVelocity(0, 0);
    
    // Set both jammed (for AI) and onCooldown (for interaction)
    musician.setData('jammed', true);
    musician.setData('onCooldown', true);
    musician.setAlpha(0.5); // Visually indicate they are exhausted
    
    const type = musician.getData('type');
    let textStr = "JAMMING!";
    let points = 200;
    
    if (type === 'vocal') textStr = "VOCAL HARMONY!";
    if (type === 'drum') textStr = "BEAT DROP!";
    if (type === 'guitar') textStr = "SHREDDING GUITAR!";
    if (type === 'bass') textStr = "SLAPPIN BASS!";
    
    this.updateHype(this.hype + points);

    if (musician === this.vocalist) {
      this.playVocalistAnimation('vocalist-hype-crowd');
    } else if (musician === this.guitarist) {
      this.playGuitaristAnimation('guitarist-crowd-hype');
    } else if (musician === this.bassist) {
      this.playBassistAnimation('bassist-crowd-hype');
    } else if (musician === this.drummer) {
      this.playDrummerAnimation('drummer-finale');
    }
    
    // Let the roadie retreat naturally to its current home position.
    this.roadiesGroup.getChildren().forEach((child: any) => {
      const roadie = child as Phaser.Physics.Arcade.Sprite;
      roadie.setData('pushUntil', 0);
    });
    
    this.cameras.main.flash(200, 0, 255, 255);
    
    const text = this.add.text(GAME_WIDTH/2, 100, textStr, {
      fontFamily: 'Outfit', fontSize: '32px', color: '#00ffff', fontStyle: '900', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);
    
    this.tweens.add({
      targets: text, scaleX: 1.2, scaleY: 1.2, yoyo: true, duration: 300, repeat: 4
    });
    
    // Performance duration - player is free to move after this
    this.time.delayedCall(BONUS_ACTION_DURATION, () => {
      text.destroy();
      this.isPerforming = false;
      
      // Reset jammed state so AI can resume normal behavior
      musician.setData('jammed', false);
      
      if (musician === this.vocalist) {
        this.startVocalistPerformance(this.time.now, this.isVocalistAtHome());
      } else if (musician === this.guitarist) {
        this.startGuitaristPerformance(this.time.now, this.isGuitaristAtHome());
      } else if (musician === this.bassist) {
        this.startBassistPerformance(this.time.now, this.isBassistAtHome());
      } else if (musician === this.drummer) {
        this.resetDrummerState(this.time.now);
      }
      
      // Reset the stage entry time to NOW so they lag for 1.5s after performance finishes
      this.stageEntryTime = this.time.now;
    });

    // Interaction cooldown - musician becomes available again after this
    this.time.delayedCall(MUSICIAN_SPECIAL_COOLDOWN, () => {
      musician.setData('onCooldown', false);
      musician.setAlpha(1);
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
        this.queueExtraCrowdReinforcements();
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

  private configurePlayerBody() {
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    const radius = 30;
    const diameter = radius * 2;
    const offsetX = Math.round((PLAYER_FRAME_WIDTH - diameter) / 2);
    const offsetY = PLAYER_FRAME_HEIGHT - diameter - 14;

    body.setCircle(radius, offsetX, offsetY);
  }

  private setPlayerCrowdSurfMode(enabled: boolean) {
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.enable = !enabled;
    }

    this.player.setDepth(enabled ? PLAYER_CROWD_SURF_DEPTH : PLAYER_BASE_DEPTH);
  }

  private updatePlayerAnimation() {
    if (this.playerSpecialAnimation) {
      this.playPlayerAnimation(`player-${this.playerSpecialAnimation}`);
      return;
    }

    const velocity = this.player.body?.velocity;
    const speedX = velocity?.x ?? 0;
    const speedY = velocity?.y ?? 0;

    let animationKey = `player-idle-${this.playerFacing}`;
    const isMoving = Math.abs(speedX) > 5 || Math.abs(speedY) > 5;

    if (Math.abs(speedX) > Math.abs(speedY) && Math.abs(speedX) > 5) {
      this.playerFacing = speedX > 0 ? 'right' : 'left';
    } else if (Math.abs(speedY) > 5) {
      this.playerFacing = speedY > 0 ? 'front' : 'back';
    }

    if (this.isPerforming) {
      animationKey = 'player-excited';
    } else if (isMoving) {
      animationKey = `player-walk-${this.playerFacing}`;
    } else {
      animationKey = `player-idle-${this.playerFacing}`;
    }

    this.playPlayerAnimation(animationKey);
  }

  private playPlayerAnimation(animationKey: string) {
    if (this.player.anims.currentAnim?.key !== animationKey) {
      this.player.play(animationKey, true);
    }
  }

  private setPlayerSpecialAnimation(animation: PlayerSpecialAnimation | null) {
    this.playerSpecialAnimation = animation;
    if (animation) {
      this.playPlayerAnimation(`player-${animation}`);
    }
  }

  private getStageDiveAnimation(): Extract<
    PlayerSpecialAnimation,
    'stage-dive-left' | 'stage-dive-right' | 'stage-dive-down'
  > {
    if (this.playerFacing === 'left') {
      return 'stage-dive-left';
    }

    if (this.playerFacing === 'right') {
      return 'stage-dive-right';
    }

    return 'stage-dive-down';
  }

  private updateSecurityAI() {
    const aiSpeed = 100;
    const rails = this.securityBarrierGroup.getChildren();
    
    this.securityChaseGroup.getChildren().forEach((child: any, index: number) => {
      const ai = child as Phaser.Physics.Arcade.Sprite;
      
      // Priority 1: Chase player if in the front stage area (150 to 250)
      if (this.player.y < SECURITY_BOTTOM_Y && this.player.y > STAGE_BOTTOM_Y) {
        ai.setData('state', 'chasing');
        ai.setData('targetRail', null);
        this.physics.moveToObject(ai, this.player, aiSpeed);
      } else {
        // Priority 2: Chase crowd intruders in the security zone
        let nearestIntruder: Phaser.Physics.Arcade.Sprite | null = null;
        let nearestDist = Infinity;
        const allCrowd = [...this.crowdGroup.getChildren(), ...this.lineCrowdGroup.getChildren()];
        allCrowd.forEach((c: any) => {
          if (c.y < SECURITY_BOTTOM_Y && c.y > STAGE_BOTTOM_Y) {
            const d = Phaser.Math.Distance.Between(ai.x, ai.y, c.x, c.y);
            if (d < nearestDist) {
              nearestDist = d;
              nearestIntruder = c;
            }
          }
        });

        if (nearestIntruder && nearestDist < 120) {
          ai.setData('state', 'chasing_crowd');
          ai.setData('targetRail', null);
          this.physics.moveToObject(ai, nearestIntruder, aiSpeed * 0.9);
        } else {
          // Priority 3: Fix broken rails
          let targetRail = ai.getData('targetRail') as Phaser.Physics.Arcade.Sprite | null;
          
          // Check if our target got fixed by someone else
          if (targetRail && !targetRail.getData('isBroken')) {
             targetRail = null;
             ai.setData('targetRail', null);
             ai.setData('state', 'patrol');
          }

          if (!targetRail) {
             // Look for an unassigned broken rail
             const brokenRails = rails.filter((r: any) => {
                 if (!r.getData('isBroken')) return false;
                 const guards = this.securityChaseGroup.getChildren();
                 let isAssigned = false;
                 guards.forEach((g: any) => {
                     if (g !== ai && g.getData('targetRail') === r) isAssigned = true;
                 });
                 return !isAssigned;
             });
             
             if (brokenRails.length > 0 && Math.random() < 0.02) {
                 targetRail = Phaser.Utils.Array.GetRandom(brokenRails) as Phaser.Physics.Arcade.Sprite;
                 ai.setData('targetRail', targetRail);
                 ai.setData('state', 'moving_to_fix');
             }
          }

          if (targetRail) {
             const dist = Phaser.Math.Distance.Between(ai.x, ai.y, targetRail.x, targetRail.y);
             if (dist < 20) {
                 ai.setVelocity(0, 0);
                 if (ai.getData('state') !== 'fixing') {
                     ai.setData('state', 'fixing');
                     this.time.delayedCall(2000, () => {
                         if (ai.getData('targetRail') === targetRail) {
                             targetRail.setData('isBroken', false);
                             targetRail.setTexture('rail');
                             if (targetRail.body) {
                                 targetRail.body.checkCollision.none = false;
                                 targetRail.setVelocity(0, 0);
                             }
                             ai.setData('targetRail', null);
                             ai.setData('state', 'patrol');
                         }
                     });
                 }
             } else {
                 this.physics.moveToObject(ai, targetRail, aiSpeed * 0.8);
             }
          } else {
             // Patrol behavior: distribute guards evenly along the rail
             ai.setData('state', 'patrol');
             const targetX = (GAME_WIDTH / 4) * (index + 1);
             const targetY = STAGE_BOTTOM_Y + 30;
             const dist = Phaser.Math.Distance.Between(ai.x, ai.y, targetX, targetY);
             if (dist > 10) {
                 this.physics.moveTo(ai, targetX, targetY, aiSpeed * 0.5);
             } else {
                 ai.setVelocity(0, 0);
             }
          }
        }
      }
      
      // Clamp them to Front Stage
      if (ai.y < STAGE_BOTTOM_Y) ai.y = STAGE_BOTTOM_Y;
      if (ai.y > SECURITY_BOTTOM_Y) ai.y = SECURITY_BOTTOM_Y;

      this.updateSecurityChaserAnimation(ai);
    });
  }

  private updateSecurityChaserAnimation(chaser: Phaser.Physics.Arcade.Sprite) {
    const velocity = chaser.body?.velocity;
    const speedX = velocity?.x ?? 0;
    const speedY = velocity?.y ?? 0;
    const isMoving = Math.abs(speedX) > 5 || Math.abs(speedY) > 5;

    let facing = (chaser.getData('facing') as SecurityFacing | undefined) ?? 'front';

    if (Math.abs(speedX) > Math.abs(speedY)) {
      if (speedX > 5) facing = 'right';
      else if (speedX < -5) facing = 'left';
    } else {
      if (speedY > 5) facing = 'front';
      else if (speedY < -5) facing = 'back';
    }

    chaser.setData('facing', facing);

    const animationKey = isMoving
      ? `security-chaser-walk-${facing}`
      : `security-chaser-idle-${facing}`;

    if (chaser.anims.currentAnim?.key !== animationKey) {
      chaser.play(animationKey, true);
    }
  }

  private updateRoadiesAI(time: number) {
    const chaseSpeed = 160;
    const returnSpeed = 120;

    this.roadiesGroup.getChildren().forEach((child: any) => {
      const ai = child as Phaser.Physics.Arcade.Sprite;
      const homeX = (ai.getData('homeX') as number | undefined) ?? ai.x;
      const homeY = (ai.getData('homeY') as number | undefined) ?? ai.y;
      const hasLeftHome = (ai.getData('hasLeftHome') as boolean | undefined) ?? false;
      const pushUntil = (ai.getData('pushUntil') as number | undefined) ?? 0;
      const distanceToHome = Phaser.Math.Distance.Between(ai.x, ai.y, homeX, homeY);

      if (this.time.now < pushUntil) {
        ai.setVelocity(0, 0);
      } else if (
        !this.isPerforming &&
        !this.isDiving &&
        this.player.y < STAGE_BOTTOM_Y &&
        this.stageEntryTime > 0 &&
        time > this.stageEntryTime + 500
      ) {
        if (!hasLeftHome && distanceToHome <= 10) {
          this.advanceRoadieHome(ai);
          ai.setData('hasLeftHome', true);
        }
        this.physics.moveToObject(ai, this.player, chaseSpeed);
      } else {
        if (distanceToHome > 10) {
          this.physics.moveTo(ai, homeX, homeY, returnSpeed);
        } else {
          ai.setPosition(homeX, homeY);
          ai.setVelocity(0, 0);
          ai.setData('hasLeftHome', false);
        }
      }

      if (ai.y > STAGE_BOTTOM_Y) {
        ai.y = STAGE_BOTTOM_Y;
        if (ai.body?.velocity.y && ai.body.velocity.y > 0) {
          ai.setVelocityY(0);
        }
      }

      this.updateRoadieAnimation(ai);
    });
  }

  private updateVocalistAI(time: number) {
    if (!this.vocalist?.active) {
      return;
    }

    if (this.isPerforming) {
      this.vocalist.setVelocity(0, 0);
      return;
    }

    const state = (this.vocalist.getData('state') as string | undefined) ?? 'performing';
    const targetX =
      (this.vocalist.getData('targetX') as number | undefined) ?? VOCALIST_HOME_POSITION.x;
    const targetY =
      (this.vocalist.getData('targetY') as number | undefined) ?? VOCALIST_HOME_POSITION.y;

    if (state === 'moving') {
      const distance = Phaser.Math.Distance.Between(this.vocalist.x, this.vocalist.y, targetX, targetY);
      if (distance <= VOCALIST_TARGET_REACHED_RADIUS) {
        this.vocalist.setPosition(targetX, targetY);
        this.startVocalistPerformance(time, this.isVocalistAtHome());
        return;
      }

      this.physics.moveTo(this.vocalist, targetX, targetY, VOCALIST_MOVE_SPEED);
      const velocity = this.vocalist.body?.velocity;
      const speedX = velocity?.x ?? 0;
      const speedY = velocity?.y ?? 0;

      let facing: VocalistFacing =
        (this.vocalist.getData('facing') as VocalistFacing | undefined) ?? 'front';

      if (Math.abs(speedX) > Math.abs(speedY)) {
        facing = speedX >= 0 ? 'right' : 'left';
      } else if (Math.abs(speedY) > 2) {
        facing = speedY >= 0 ? 'front' : 'back';
      }

      this.vocalist.setData('facing', facing);

      if (facing === 'right') {
        this.playVocalistAnimation('vocalist-walk-left', true);
      } else if (facing === 'left') {
        this.playVocalistAnimation('vocalist-walk-left');
      } else if (facing === 'back') {
        this.playVocalistAnimation('vocalist-walk-back');
      } else {
        this.playVocalistAnimation('vocalist-walk-front');
      }
      return;
    }

    this.vocalist.setVelocity(0, 0);

    const stateUntil = (this.vocalist.getData('stateUntil') as number | undefined) ?? 0;
    if (time >= stateUntil) {
      this.chooseNextVocalistAction(time);
    }
  }

  private updateGuitaristAI(time: number) {
    if (!this.guitarist?.active) {
      return;
    }

    if (this.guitarist.getData('jammed')) {
      this.guitarist.setVelocity(0, 0);
      return;
    }

    if (this.isPerforming) {
      this.guitarist.setVelocity(0, 0);
      return;
    }

    const state = (this.guitarist.getData('state') as string | undefined) ?? 'performing';
    const targetX =
      (this.guitarist.getData('targetX') as number | undefined) ?? GUITARIST_HOME_POSITION.x;
    const targetY =
      (this.guitarist.getData('targetY') as number | undefined) ?? GUITARIST_HOME_POSITION.y;

    if (state === 'moving') {
      const distance = Phaser.Math.Distance.Between(this.guitarist.x, this.guitarist.y, targetX, targetY);
      if (distance <= GUITARIST_TARGET_REACHED_RADIUS) {
        this.guitarist.setPosition(targetX, targetY);
        this.startGuitaristPerformance(time, this.isGuitaristAtHome());
        return;
      }

      this.physics.moveTo(this.guitarist, targetX, targetY, GUITARIST_MOVE_SPEED);
      const velocity = this.guitarist.body?.velocity;
      const speedX = velocity?.x ?? 0;
      const speedY = velocity?.y ?? 0;

      let facing: GuitaristFacing =
        (this.guitarist.getData('facing') as GuitaristFacing | undefined) ?? 'front';

      if (Math.abs(speedX) > Math.abs(speedY)) {
        facing = speedX >= 0 ? 'right' : 'left';
      } else if (Math.abs(speedY) > 2) {
        facing = speedY >= 0 ? 'front' : 'back';
      }

      this.guitarist.setData('facing', facing);
      this.playGuitaristAnimation(`guitarist-walk-${facing}`);
      return;
    }

    this.guitarist.setVelocity(0, 0);

    const stateUntil = (this.guitarist.getData('stateUntil') as number | undefined) ?? 0;
    if (time >= stateUntil) {
      this.chooseNextGuitaristAction(time);
    }
  }

  private updateBassistAI(time: number) {
    if (!this.bassist?.active) {
      return;
    }

    if (this.bassist.getData('jammed')) {
      this.bassist.setVelocity(0, 0);
      return;
    }

    if (this.isPerforming) {
      this.bassist.setVelocity(0, 0);
      return;
    }

    const state = (this.bassist.getData('state') as string | undefined) ?? 'performing';
    const targetX =
      (this.bassist.getData('targetX') as number | undefined) ?? BASSIST_HOME_POSITION.x;
    const targetY =
      (this.bassist.getData('targetY') as number | undefined) ?? BASSIST_HOME_POSITION.y;

    if (state === 'moving') {
      const distance = Phaser.Math.Distance.Between(this.bassist.x, this.bassist.y, targetX, targetY);
      if (distance <= BASSIST_TARGET_REACHED_RADIUS) {
        this.bassist.setPosition(targetX, targetY);
        this.startBassistPerformance(time, this.isBassistAtHome());
        return;
      }

      this.physics.moveTo(this.bassist, targetX, targetY, BASSIST_MOVE_SPEED);
      const velocity = this.bassist.body?.velocity;
      const speedX = velocity?.x ?? 0;
      const speedY = velocity?.y ?? 0;

      let facing: BassistFacing =
        (this.bassist.getData('facing') as BassistFacing | undefined) ?? 'front';

      if (Math.abs(speedX) > Math.abs(speedY)) {
        facing = speedX >= 0 ? 'right' : 'left';
      } else if (Math.abs(speedY) > 2) {
        facing = speedY >= 0 ? 'front' : 'back';
      }

      this.bassist.setData('facing', facing);
      this.playBassistAnimation(`bassist-walk-${facing}`);
      return;
    }

    this.bassist.setVelocity(0, 0);

    const stateUntil = (this.bassist.getData('stateUntil') as number | undefined) ?? 0;
    if (time >= stateUntil) {
      this.chooseNextBassistAction(time);
    }
  }

  private updateCrowdAI(time: number) {
    this.crowdGroup.getChildren().forEach((child: any) => {
      const entity = child as Phaser.Physics.Arcade.Sprite;
      
      // Skip if recently pushed by the player
      const pushedUntil = entity.getData('pushedUntil') || 0;
      if (this.time.now >= pushedUntil) {
        const isAggressive = entity.getData('isAggressive');
        const offset = entity.getData('jiggleOffsetX');
        
        const pushMultiplier = isAggressive ? this.aggroMultiplier : 1.0;
        const targetVelocityY = this.pushForce * pushMultiplier;
        const jostleTime = (time + offset) * 0.005;
        const targetVelocityX = Math.sin(jostleTime) * this.jostleForce * pushMultiplier;
        
        entity.setAcceleration(targetVelocityX, targetVelocityY);
        entity.setMaxVelocity(this.jostleForce * 1.5, Math.abs(this.pushForce) * 2);
      } else {
        entity.setAcceleration(0, 0);
      }
      
      const minSafeY = SECURITY_BOTTOM_Y + 25; // 250 + radius buffer
      if (entity.y < minSafeY) {
        entity.y = minSafeY;
        if (entity.body && entity.body.velocity.y < 0) {
            entity.setVelocityY(0);
        }
      }

      if (entity.getData('crowdAnimPrefix')) {
        this.updateAggroCrowdAnimation(entity);
      }

      this.updateCrowdDepth(entity);
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
        const entity = this.createCrowdMember(this.lineCrowdGroup, startX, laneY, isAggressive, true);
        entity.setData('direction', direction);

        const speedOffset = Phaser.Math.Between(-20, 40);
        entity.setVelocityX(direction * (this.lineBaseSpeed + speedOffset));
        if (entity.getData('crowdAnimPrefix')) {
          this.updateAggroCrowdAnimation(entity, direction === 1 ? 'right' : 'left');
        }
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

      if (entity.getData('crowdAnimPrefix')) {
        const direction = entity.getData('direction');
        this.updateAggroCrowdAnimation(entity, direction === 1 ? 'right' : 'left');
      }

      this.updateCrowdDepth(entity);
    });
  }

  private crowdBarrierProcessCallback(crowdMember: any, _barrier: any): boolean {
    const c = crowdMember as Phaser.Physics.Arcade.Sprite;
    // Check if this crowd member is near any broken rail gap
    const rails = this.securityBarrierGroup.getChildren();
    for (const rail of rails) {
      const r = rail as Phaser.Physics.Arcade.Sprite;
      if (r.getData('isBroken')) {
        const dist = Math.abs(c.x - r.x);
        if (dist < 40) {
          // Near a broken rail gap — let them through!
          return false;
        }
      }
    }
    // No gap nearby — block them
    return true;
  }

  private handleSecurityVsCrowd(_security: any, crowdMember: any) {
    const c = crowdMember as Phaser.Physics.Arcade.Sprite;
    // Only shove if the crowd member is in the security zone
    if (c.y < SECURITY_BOTTOM_Y && c.y > STAGE_BOTTOM_Y) {
      // Shove them back toward the crowd
      const shoveForce = 300;
      c.setVelocityY(shoveForce);
      c.setVelocityX(Phaser.Math.Between(-100, 100));
    }
  }

  private handleAggroAttack(
    player: Phaser.Physics.Arcade.Sprite,
    crowdEntity: Phaser.Physics.Arcade.Sprite,
    shoveForce: number
  ) {
    if (this.isDiving || this.isPerforming) return;

    const now = this.time.now;
    const nextAttackAt = (crowdEntity.getData('nextAttackAt') as number | undefined) ?? 0;
    if (now < nextAttackAt || now < this.playerAggroInvulnerableUntil) {
      return;
    }

    const facing = this.getCrowdFacingFromVelocity(
      player.x - crowdEntity.x,
      player.y - crowdEntity.y,
      (crowdEntity.getData('crowdFacing') as CrowdFacing | undefined) ?? 'front'
    );

    crowdEntity.setData('crowdFacing', facing);
    crowdEntity.setData('nextAttackAt', now + AGGRO_CROWD_ATTACK_COOLDOWN_MS);
    crowdEntity.setData('attackUntil', now + AGGRO_CROWD_ATTACK_RECOVERY_MS);
    this.playerAggroInvulnerableUntil = now + AGGRO_CROWD_ATTACK_COOLDOWN_MS;
    this.playAggroCrowdAnimation(crowdEntity, 'attack');

    const angle = Phaser.Math.Angle.Between(crowdEntity.x, crowdEntity.y, player.x, player.y);
    player.setVelocityX((player.body?.velocity.x || 0) + Math.cos(angle) * shoveForce);
    player.setVelocityY((player.body?.velocity.y || 0) + Math.sin(angle) * shoveForce);

    this.aggroHitCount += 1;
    const shouldLoseHalfLife = this.aggroHitCount % AGGRO_HITS_PER_HALF_LIFE === 0;
    if (shouldLoseHalfLife) {
      this.lives = Math.max(0, this.lives - 1);
      this.updateLivesDisplay();
    }

    this.updateHype(Math.max(0, this.hype - 8));
    this.cameras.main.shake(110, 0.006);
    this.cameras.main.flash(90, 255, 96, 0);

    this.time.delayedCall(AGGRO_CROWD_ATTACK_RECOVERY_MS, () => {
      if (crowdEntity.active) {
        this.updateAggroCrowdAnimation(crowdEntity);
      }
    });

    if (shouldLoseHalfLife && this.lives <= 0) {
      this.isDiving = true;
      this.player.setVelocity(0, 0);
      this.setPlayerSpecialAnimation('beated');
      this.showGameOver('MAULED\nBY CROWD!', '#ff6600');
    }
  }

  private handlePitCollision(player: any, crowdEntity: any) {
    const p = player as Phaser.Physics.Arcade.Sprite;
    const c = crowdEntity as Phaser.Physics.Arcade.Sprite;
    const isAggro = c.getData('isAggressive');
    
    if (isAggro) {
      this.handleAggroAttack(p, c, AGGRO_CROWD_PIT_SHOVE_FORCE * this.aggroMultiplier);
    }
    
    if (Math.random() < 0.05) this.updateHype(this.hype + 0.5);
  }

  private handleLineCollision(player: any, crowdEntity: any) {
    const p = player as Phaser.Physics.Arcade.Sprite;
    const c = crowdEntity as Phaser.Physics.Arcade.Sprite;
    const isAggro = c.getData('isAggressive');
    
    if (isAggro) {
      this.handleAggroAttack(p, c, AGGRO_CROWD_LINE_SHOVE_FORCE * this.aggroMultiplier);
    }
    
    if (Math.random() < 0.05) this.updateHype(this.hype + 0.5);
  }

  private handleSecurityCatch(_player: any, _security: any) {
    if (this.isDiving || this.isPerforming) return;
    
    this.isDiving = true;
    this.player.setVelocity(0, 0);
    this.setPlayerSpecialAnimation('beated');

    // Consume half heart (1 internally)
    this.lives -= 1;
    this.updateLivesDisplay();

    this.cameras.main.shake(200, 0.02);
    this.cameras.main.flash(200, 255, 0, 0);
    this.updateHype(Math.max(0, this.hype - 20));
    this.showFeedbackText('BEATEN!', '#ff0000');

    if (this.lives <= 0) {
        this.time.delayedCall(500, () => this.showGameOver('BEATEN!', '#ff0000'));
    }

    const side = Math.random() < 0.5 ? -50 : GAME_WIDTH + 50; 
    
    this.tweens.add({
        targets: this.player,
        x: side,
        rotation: (side < 0 ? -1 : 1) * Math.PI * 4,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
            if (this.lives <= 0) return;
            const oppSide = side < 0 ? GAME_WIDTH + 50 : -50;
            const backY = GAME_HEIGHT - 100;
            this.player.setPosition(oppSide, backY);

            this.tweens.add({
                targets: this.player,
                x: GAME_WIDTH / 2,
                rotation: (oppSide < 0 ? 1 : -1) * Math.PI * 4,
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    this.isDiving = false;
                    this.setPlayerSpecialAnimation(null);
                    this.playerFacing = 'front';
                    this.player.setRotation(0);
                    this.playPlayerAnimation('player-idle-front');
                }
            });
        }
    });
  }

  private handleRoadieCatch(_player: any, roadieSprite: any) {
    if (this.isDiving || this.isPerforming) return;
    this.triggerRoadiePush(roadieSprite as Phaser.Physics.Arcade.Sprite);
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

  private updateLivesDisplay() {
    let hearts = '';
    let full = Math.floor(this.lives / 2);
    let half = this.lives % 2 !== 0;
    for (let i = 0; i < full; i++) hearts += '♥';
    if (half) hearts += '½';
    this.livesText.setText(hearts);
  }

  private respawnPlayer() {
    this.isDiving = false;
    this.playerAggroInvulnerableUntil = 0;
    this.player.setPosition(GAME_WIDTH / 2, SPAWN_Y);
    this.player.setVelocity(0, 0);
    this.player.setAlpha(1);
    this.player.setRotation(0);
    this.playerFacing = 'front';
    this.setPlayerCrowdSurfMode(false);
    this.setPlayerSpecialAnimation(null);
    this.playPlayerAnimation('player-idle-front');
    this.updateHype(0);
  }

  private showFeedbackText(text: string, color: string) {
    const feedbackText = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, text, {
      fontFamily: 'Outfit', fontSize: '42px', fontStyle: '900', color: color, stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: feedbackText, y: GAME_HEIGHT/2 - 50, alpha: 0, duration: 2000, ease: 'Power2', onComplete: () => feedbackText.destroy()
    });
  }

  private carryPlayerByCrowd(
    endY: number,
    duration: number,
    onStep?: () => void,
    onComplete?: () => void
  ) {
    const startX = this.player.x;
    const startY = this.player.y;
    const driftDirection = Math.random() < 0.5 ? -1 : 1;

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const progress = tween.getValue() ?? 0;
        const envelope = Math.sin(Math.PI * progress);
        const baseY = Phaser.Math.Linear(startY, endY, progress);

        const wideSway = Math.sin(progress * Math.PI * 1.2) * 34 * envelope * driftDirection;
        const mediumSway = Math.sin(progress * Math.PI * 4.4 + driftDirection * 0.7) * 13 * envelope;
        const smallSway = Math.sin(progress * Math.PI * 12 + 0.5) * 4 * envelope;

        const largeBob = Math.sin(progress * Math.PI * 2.4 + 0.4) * 11 * envelope;
        const smallBob = Math.sin(progress * Math.PI * 9.2) * 4 * envelope;

        const x = Phaser.Math.Clamp(startX + wideSway + mediumSway + smallSway, 56, GAME_WIDTH - 56);
        const y = baseY + largeBob + smallBob;

        this.player.setPosition(x, y);
        this.player.setRotation(
          Math.sin(progress * Math.PI * 2.8) * 0.12 +
          Math.sin(progress * Math.PI * 10.5) * 0.03
        );

        onStep?.();
      },
      onComplete: () => {
        this.player.setY(endY);
        this.player.setRotation(0);
        onComplete?.();
      }
    });
  }

  private executeStageDive(forcedByRoadie: boolean = false) {
    this.isDiving = true;
    this.player.setVelocity(0, 0);
    const diveAnimation = this.getStageDiveAnimation();
    this.setPlayerSpecialAnimation(diveAnimation);
    
    let endY = STAGE_BOTTOM_Y + 150; 
    let endX = this.player.x;
    let resultText = "CAUGHT!";
    let color = "#ffff00";
    let isFail = false;
    let isEpic = false;

    if (diveAnimation === 'stage-dive-left') {
      endX -= 90;
    } else if (diveAnimation === 'stage-dive-right') {
      endX += 90;
    }

    endX = Phaser.Math.Clamp(endX, 48, GAME_WIDTH - 48);
    
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

    if (isFail) {
      // Part the crowd for any fail (including roadies)
      const allCrowd = [...this.crowdGroup.getChildren(), ...this.lineCrowdGroup.getChildren()];
      allCrowd.forEach((child: any) => {
        const dist = Phaser.Math.Distance.Between(child.x, child.y, endX, endY);
        if (dist < 80) {
          const angle = Phaser.Math.Angle.Between(endX, endY, child.x, child.y);
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
      x: endX,
      y: endY,
      duration: 1500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (isFail) {
          this.setPlayerSpecialAnimation('faceplant');
          this.lives -= 2;
          this.updateLivesDisplay();
          this.showFeedbackText(resultText, color);
          
          this.cameras.main.shake(200, 0.02);
          this.cameras.main.flash(200, 255, 0, 0);
          
          if (this.lives <= 0) {
            this.showGameOver(resultText, color);
          } else {
            this.time.delayedCall(1500, () => this.respawnPlayer());
          }
        } else if (isEpic) {
          this.setPlayerSpecialAnimation('crowd-surf-up');
          this.setPlayerCrowdSurfMode(true);
          this.carryPlayerByCrowd(
            GAME_HEIGHT - 100,
            EPIC_CROWD_SURF_DURATION,
            () => {
              // Make nearby crowd cheer
              this.crowdGroup.getChildren().forEach((child: any) => {
                if (Math.abs(child.y - this.player.y) < 60 && Math.abs(child.x - this.player.x) < 80) {
                  if (!this.tweens.isTweening(child)) {
                    this.tweens.add({ targets: child, scaleY: 1.2, scaleX: 1.2, yoyo: true, duration: 200 });
                  }
                }
              });
            },
            () => {
              if (this.lives < 6) {
                this.lives = Math.min(this.lives + 2, 6);
                this.updateLivesDisplay();
              }
              this.showFeedbackText("EPIC SURF! +1 LIFE!", color);
              this.time.delayedCall(1500, () => this.respawnPlayer());
            }
          );
        } else {
          this.setPlayerSpecialAnimation('crowd-surf-up');
          this.setPlayerCrowdSurfMode(true);
          this.showFeedbackText(resultText, color);
          this.time.delayedCall(1500, () => {
            this.isDiving = false;
            this.setPlayerCrowdSurfMode(false);
            this.setPlayerSpecialAnimation(null);
            this.player.setRotation(0);
            this.playPlayerAnimation(`player-idle-${this.playerFacing}`);
            this.updateHype(0); // Reset hype so they have to build it up again
          });
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
