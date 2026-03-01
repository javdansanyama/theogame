import Phaser from 'phaser';
import { registerSW } from 'virtual:pwa-register';
import './style.css';

type TouchState = {
  left: boolean;
  right: boolean;
  jump: boolean;
};

const touchState: TouchState = {
  left: false,
  right: false,
  jump: false
};

class GameScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private coins!: Phaser.Physics.Arcade.StaticGroup;
  private scoreText!: Phaser.GameObjects.Text;
  private winText!: Phaser.GameObjects.Text;
  private score = 0;
  private won = false;

  preload(): void {
    this.load.image('sky', 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
        <rect width="100%" height="100%" fill="#38bdf8"/>
        <circle cx="50" cy="50" r="24" fill="#fef08a"/>
      </svg>
    `));
    this.load.image('ground', 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="256" height="32">
        <rect width="100%" height="100%" fill="#22c55e"/>
      </svg>
    `));
    this.load.image('player', 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="48">
        <rect x="4" y="2" width="24" height="44" rx="10" fill="#f97316"/>
        <circle cx="16" cy="18" r="3" fill="#111827"/>
      </svg>
    `));
    this.load.image('coin', 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <circle cx="12" cy="12" r="10" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>
      </svg>
    `));
  }

  create(): void {
    this.add.image(400, 300, 'sky').setDisplaySize(800, 600);

    const ground = this.physics.add.staticGroup();
    ground.create(400, 585, 'ground').setScale(4, 1).refreshBody();
    ground.create(120, 430, 'ground').setScale(1.2, 1).refreshBody();
    ground.create(680, 330, 'ground').setScale(1.2, 1).refreshBody();

    this.player = this.physics.add.sprite(80, 520, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.1);

    this.coins = this.physics.add.staticGroup();
    [150, 300, 420, 610, 740].forEach((x, index) => {
      this.coins.create(x, 390 - index * 55, 'coin');
    });

    this.physics.add.collider(this.player, ground);
    this.physics.add.overlap(this.player, this.coins, (_player, coin) => {
      coin.destroy();
      this.score += 1;
      this.scoreText.setText(`Coins: ${this.score}/5`);
      if (this.score >= 5) {
        this.won = true;
        this.winText.setVisible(true);
        this.player.setVelocityX(0);
      }
    });

    this.cursors = this.input.keyboard?.createCursorKeys() ?? ({} as Phaser.Types.Input.Keyboard.CursorKeys);

    this.scoreText = this.add.text(16, 16, 'Coins: 0/5', {
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#1e293b',
      strokeThickness: 5
    });

    this.winText = this.add.text(400, 160, 'You Win!', {
      fontSize: '64px',
      color: '#fef08a',
      stroke: '#7c2d12',
      strokeThickness: 8
    }).setOrigin(0.5).setVisible(false);

    this.scale.on('resize', this.handleResize, this);
    this.handleResize(this.scale.gameSize);
  }

  update(): void {
    if (this.won) {
      return;
    }

    const goingLeft = touchState.left || this.cursors.left?.isDown;
    const goingRight = touchState.right || this.cursors.right?.isDown;
    const jumpPressed = touchState.jump || this.cursors.up?.isDown || this.cursors.space?.isDown;

    if (goingLeft) {
      this.player.setVelocityX(-220);
    } else if (goingRight) {
      this.player.setVelocityX(220);
    } else {
      this.player.setVelocityX(0);
    }

    if (jumpPressed && this.player.body.blocked.down) {
      this.player.setVelocityY(-420);
    }
  }

  private handleResize(size: Phaser.Structs.Size | Phaser.Types.Structs.Size): void {
    const width = 'width' in size ? size.width : 800;
    const height = 'height' in size ? size.height : 600;
    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setZoom(Math.max(width / 800, height / 600));
    this.cameras.main.centerOn(400, 300);
  }
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('Missing #app element');
}

app.innerHTML = `
  <div id="game-root"></div>
  <div id="controls" aria-label="Touch controls">
    <div class="control-cluster">
      <button class="control-btn" data-control="left" aria-label="Move left">◀</button>
      <button class="control-btn" data-control="right" aria-label="Move right">▶</button>
    </div>
    <div class="control-cluster">
      <button class="control-btn" data-control="jump" aria-label="Jump">⤒</button>
    </div>
  </div>
`;

const setControlState = (control: keyof TouchState, active: boolean): void => {
  touchState[control] = active;
};

const bindTouchButton = (button: HTMLButtonElement, control: keyof TouchState): void => {
  const start = (event: Event): void => {
    event.preventDefault();
    button.classList.add('active');
    setControlState(control, true);
  };

  const end = (event: Event): void => {
    event.preventDefault();
    button.classList.remove('active');
    setControlState(control, false);
  };

  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', end);
  button.addEventListener('pointerleave', end);
  button.addEventListener('pointercancel', end);
};

document.querySelectorAll<HTMLButtonElement>('.control-btn').forEach((button) => {
  const control = button.dataset.control as keyof TouchState;
  if (control) {
    bindTouchButton(button, control);
  }
});

window.addEventListener('blur', () => {
  touchState.left = false;
  touchState.right = false;
  touchState.jump = false;
  document.querySelectorAll('.control-btn').forEach((button) => button.classList.remove('active'));
});

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: 800,
  height: 600,
  backgroundColor: '#0f172a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 950, x: 0 },
      debug: false
    }
  },
  scene: [GameScene]
};

new Phaser.Game(config);
registerSW({ immediate: true });
