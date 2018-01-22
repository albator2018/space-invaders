var game = new Phaser.Game(640, 480, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });

var bulletTime = 0,
    initialPlayerPosition = 512,
    lives = 3,
    score = 0;

var style = { font: "32px silkscreen", fill: "#666666", align: "center" },
    boldStyle = { font: "bold 32px silkscreen", fill: "#ffffff", align: "center" };

function preload () {
  game.load.image('ship', 'assets/ship.png');
  game.load.image('bullet', 'assets/bullet.png');
  game.load.image('alien', 'assets/alien.png');
  game.load.image('bomb', 'assets/bomb.png');
  game.load.spritesheet('explosion', 'assets/explosion.png', 80, 80);
  game.load.atlasJSONArray('invaders', 'images/spritesheets/invaders.png', 'images/spritesheets/invaders.json');

  game.load.audio('shoot', 'assets/sounds/shoot.wav');
  game.load.audio('explode', 'assets/sounds/invaderkilled.wav');
  game.load.audio('explosion', 'assets/sounds/explosion.wav');
  game.load.audio('bomb', 'assets/sounds/bomb.wav');
}

function create () {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  // Initialize player
  player = game.add.sprite(initialPlayerPosition, 540, 'ship');
  player.anchor.setTo(0.5, 0.5);
  game.physics.enable(player, Phaser.Physics.ARCADE);

  player.body.bounce.x = 0.5;
  player.body.collideWorldBounds = true;

  // Initialize bullets
  bullets = game.add.group();
  bullets.enableBody = true;
  bullets.physicsBodyType = Phaser.Physics.ARCADE;
  bullets.createMultiple(5, 'bullet');
  bullets.setAll('anchor.x', 0.5);
  bullets.setAll('anchor.y', 1);
  bullets.setAll('checkWorldBounds', true);
  bullets.setAll('outOfBoundsKill', true);

  // Initialize aliens
  createAliens();
  animateAliens();

  // Initialize bombs
  bombs = game.add.group();
  bombs.enableBody = true;
  bombs.physicsBodyType = Phaser.Physics.ARCADE;
  bombs.createMultiple(10, 'bomb');
  bombs.setAll('anchor.x', 0.5);
  bombs.setAll('anchor.y', 0.5);
  bombs.setAll('checkWorldBounds', true);
  bombs.setAll('outOfBoundsKill', true);

  // Initialize explosions
  explosions = game.add.group();
  explosions.createMultiple(10, 'explosion');
  explosions.setAll('anchor.x', 0.5);
  explosions.setAll('anchor.y', 0.5);
  explosions.forEach(setupExplosion, this);

  // Text bits
  livesText = game.add.text(game.world.bounds.width - 50, 16, "LIVES: " + lives, style);
  livesText.anchor.set(1, 0);

  scoreText = game.add.text(100, 16, 'SCORE: ' + score, style);
  scoreText.anchor.set(0.5, 0);

  // Initialize sounds
  shootSound = game.add.audio('shoot', 1, false);
  explodeSound = game.add.audio('explode', 1, false);
  bombSound = game.add.audio('bomb', 1, false);
  explosionSound = game.add.audio('explosion', 1, false);

  // Setup controls
  cursors = game.input.keyboard.createCursorKeys();
  fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  restartButton = game.input.keyboard.addKey(Phaser.Keyboard.S);
}

function setupExplosion (explosion) {
  explosion.animations.add('explode');
}

function fireBullet () {
  if (game.time.now > bulletTime) {
    bullet = bullets.getFirstExists(false);

    if (bullet) {
      // And fire it
      shootSound.play();
      bullet.reset(player.x, player.y - 16);
      bullet.body.velocity.y = -400;
      bullet.body.velocity.x = player.body.velocity.x / 4;
      bulletTime = game.time.now + 400;
    }
  }
}

function updateScore () {
  scoreText.text = "SCORE: " + score;
}

function bulletHitsAlien (bullet, alien) {
  bullet.kill();
  explode(alien);
  score += 10;
  updateScore();

  if (aliens.countLiving() == 0) {
    newWave();
  }
}

function bombHitsPlayer (bomb, player) {
  bomb.kill();
  explosion(player);
  lives -= 1;
  updateLivesText();
  if (lives > 0) {
    respawnPlayer();
  }
  else {
    gameOver();
  }
}

function explode (entity) {
  entity.kill();

  // And create an explosion :)
  explodeSound.play();
  var explosion = explosions.getFirstExists(false);
  explosion.reset(entity.body.x + (entity.width / 2), entity.body.y + (entity.height / 2));
  explosion.play('explode', 30, false, true);
}

function explosion (entity) {
  entity.kill();

  // And create an explosion :)
  explosionSound.play();
  var explosion = explosions.getFirstExists(false);
  explosion.reset(entity.body.x + (entity.width / 2), entity.body.y + (entity.height / 2));
  explosion.play('explode', 30, false, true);
}

function updateLivesText () {
  livesText.text = "LIVES: " + lives;
}

function respawnPlayer () {
  player.body.x = initialPlayerPosition;
  setTimeout(function () {
    player.revive();
  }, 1000);
}

function newWave () {
  setTimeout(function () {
    aliens.removeAll();
    createAliens();
    animateAliens();
  }, 1000);
}

function restartGame () {
  gameOverText.destroy();
  restartText.destroy();

  lives = 3;
  score = 0;

  updateScore();
  updateLivesText();

  respawnPlayer();
  newWave();
}

function gameOver () {
  gameOverText = game.add.text(game.world.centerX, game.world.centerY, "GAME OVER", boldStyle);
  gameOverText.anchor.set(0.5, 0.5);
  restartText = game.add.text(game.world.centerX, game.world.height - 16, "PRESS 'S' TO RESTART", style);
  restartText.anchor.set(0.5, 1);
}

function createAliens () {
  aliens = game.add.group();
  aliens.enableBody = true;
  aliens.physicsBodyType = Phaser.Physics.ARCADE;

  for (var y = 0; y < 4; y++) {
    for (var x = 0; x < 10; x++) {
      var alien = aliens.create(x * 50, y * 40, 'alien');
      alien.anchor.setTo(0.5, 0.5);
      alien.body.moves = false;
    }
  }

  aliens.x = 50;
  aliens.y = 100;

}

function animateAliens () {
  var tween = game.add.tween(aliens).to( { x: 100 }, 2500, Phaser.Easing.Linear.None, true, 0, 1000, true);
  tween.onLoop.add(descend, this);
}

function descend () {
  aliens.y += 10;
}

function handleBombs () {
  aliens.forEachAlive(function (alien) {
    chanceOfDroppingBomb = game.rnd.integerInRange(0, 20 * aliens.countLiving());
    if (chanceOfDroppingBomb == 0) {
      dropBomb(alien);
    }
  }, this);
}

function dropBomb (alien) {
  bomb = bombs.getFirstExists(false);

  if (bomb && player.alive) {

    bombSound.play();
    // And drop it
    bomb.reset(alien.x + aliens.x, alien.y + aliens.y + 16);
    bomb.body.velocity.y = +100;
    bomb.body.gravity.y = 250;
  }
}

function update () {
  if (cursors.left.isDown) {
    // Move to the left
    player.body.x -= 5;
  }

  if (cursors.right.isDown) {
    // Move to the right
    player.body.x += 5;
  }

  // Firing?
  if (fireButton.isDown && player.alive) {
    fireBullet();
  }

  // Restart?
  if (restartButton.isDown && lives == 0) {
    restartGame();
  }

  // Handle aliens dropping bombs
  handleBombs();

  game.physics.arcade.overlap(bullets, aliens, bulletHitsAlien, null, this);
  game.physics.arcade.overlap(bombs, player, bombHitsPlayer, null, this);
}
