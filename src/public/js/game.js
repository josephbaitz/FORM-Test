var config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 3689,
  height: 778,
  pixelArt: true,
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

var game = new Phaser.Game(config);

function preload() {
  this.load.spritesheet("player", "assets/Run_Forward.png", {
    frameWidth: 64,
    frameHeight: 64,
  });

  // loading background client side
  this.load.image("sky", "assets/bg_7_sky.png");
}

function create() {
  var self = this;
  this.socket = io();
  this.players = this.add.group();

  // adding players client side
  this.socket.on("currentPlayers", function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        displayPlayers(self, players[id], "player");
      } else {
        displayPlayers(self, players[id], "player");
      }
    });
  });

  this.socket.on("newPlayer", function (playerInfo) {
    displayPlayers(self, playerInfo, "player");
  });

  // removing players when they disconnect
  this.socket.on("disconnect", function (playerId) {
    self.players.getChildren().forEach(function (player) {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  });

  this.socket.on("playerUpdates", function (players) {
    Object.keys(players).forEach(function (id) {
      self.players.getChildren().forEach(function (player) {
        if (players[id].playerId === player.playerId) {
          player.setPosition(players[id].x, players[id].y);
        }
      });
    });
  });

  // players input to be sent to the server
  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
  // adding background client side
  this.sky = this.add
    .tileSprite(0, 0, config.width, config.height, "sky")
    .setOrigin(0, 0)
    .setScrollFactor(0);
}

function update() {
  const left = this.leftKeyPressed;
  const right = this.rightKeyPressed;
  const up = this.upKeyPressed;

  if (this.cursors.left.isDown) {
    this.leftKeyPressed = true;
  } else if (this.cursors.right.isDown) {
    this.rightKeyPressed = true;
  } else {
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
  }

  if (this.cursors.up.isDown) {
    this.upKeyPressed = true;
  } else {
    this.upKeyPressed = false;
  }

  if (
    left !== this.leftKeyPressed ||
    right !== this.rightKeyPressed ||
    up !== this.upKeyPressed
  ) {
    this.socket.emit("playerInput", {
      left: this.leftKeyPressed,
      right: this.rightKeyPressed,
      up: this.upKeyPressed,
    });
  }
}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add
    .sprite(playerInfo.x, playerInfo.y, sprite)
    .setOrigin(0.5, 0.5);
  if (playerInfo.team === "blue") player.setTint(0x0000ff);
  else player.setTint(0xff0000);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}
