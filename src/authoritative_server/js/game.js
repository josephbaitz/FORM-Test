// holds players information
const players = {};

const config = {
  type: Phaser.HEADLESS,
  parent: "phaser-example",
  width: 3689,
  height: 778,
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
      gravity: { y: 300 },
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  autoFocus: false,
};

function preload() {
  this.load.spritesheet("player", "assets/Run_Forward.png", {
    frameWidth: 64,
    frameHeight: 64,
  });
  // loading background server side
  this.load.image("sky", "assets/bg_7_sky.png");
}

function create() {
  const self = this;
  this.players = this.physics.add.group({
    // add physics to players here
    collideWorldBounds: true,
  });

  io.on("connection", function (socket) {
    console.log("a player has joined the game");
    // create a new player and add it to our players object
    players[socket.id] = {
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      team: Math.floor(Math.random() * 2) == 0 ? "red" : "blue",
      input: {
        left: false,
        right: false,
        up: false,
      },
    };
    // add player to server
    addPlayer(self, players[socket.id]);
    // send the players object to the new player
    socket.emit("currentPlayers", players);
    // update all other players of the new player
    socket.broadcast.emit("newPlayer", players[socket.id]);
    socket.on("disconnect", function () {
      console.log("a player has left the game");
      // remove player from server
      removePlayer(self, socket.id);
      // remove this player from our players object
      delete players[socket.id];
      // emit a message to all players to remove this player
      io.emit("disconnect", socket.id);
    });
    // when a player moves, update the player data
    socket.on("playerInput", function (inputData) {
      handlePlayerInput(self, socket.id, inputData);
    });
  });

  this.add
    .tileSprite(0, 0, config.width, config.height, "sky")
    .setOrigin(0, 0)
    .setScrollFactor(0);

  this.anims.create({
    key: "run-forward",
    frames: this.anims.generateFrameNumbers("player", {
      start: 0,
      end: 3,
    }),
    frameRate: 10,
    repeat: -1,
  });
}

function update() {
  this.players.getChildren().forEach((player) => {
    const input = players[player.playerId].input;
    if (input.left) {
      player.setVelocityX(-160);
    } else if (input.right) {
      player.setVelocityX(160);
      player.anims.play("run-forward", true);
    } else {
      player.setVelocityX(0);
    }

    if (input.up) {
      player.setVelocityY(-330);
    } else if (input.down) {
      player.setVelocityY(300);
    }

    players[player.playerId].x = player.x;
    players[player.playerId].y = player.y;
  });

  io.emit("playerUpdates", players);
}

function handlePlayerInput(self, playerId, input) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      players[player.playerId].input = input;
    }
  });
}

function addPlayer(self, playerInfo) {
  const player = self.physics.add
    .image(playerInfo.x, playerInfo.y, "player")
    .setOrigin(0.5, 0.5);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}

function removePlayer(self, playerId) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      player.destroy();
    }
  });
}

const game = new Phaser.Game(config);
window.gameLoaded();
