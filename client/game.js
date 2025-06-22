/**
 * Game logic.
 *
 * Updates the UI by parsing Torii responses.
 * Sends transactions to the chain using controller account.
 */

const ACTION_CONTRACT = 'di-actions';
const POSITION_MODEL = 'di-Position';
const MOVES_MODEL = 'di-Moves';
const GAME_MODEL = 'di-Game';
const GAME_COUNTER_MODEL = 'di-GameCounter';
const MOON_ROCKS_MODEL = 'di-MoonRocks';

// Game constants
const GAME_ENTRY_COST = 10;

function updateFromEntityData(entity) {
  if (entity.models) {
    if (entity.models[POSITION_MODEL]) {
      const position = entity.models[POSITION_MODEL];
      updatePositionDisplay(position.x.value, position.y.value);
    }

    if (entity.models[MOVES_MODEL]) {
      const remaining = entity.models[MOVES_MODEL].remaining.value;
      updateMovesDisplay(remaining);
    }

    if (entity.models[GAME_MODEL]) {
      const game = entity.models[GAME_MODEL];
      updateGameDisplay(game);
    }

    if (entity.models[MOON_ROCKS_MODEL]) {
      const moonRocks = entity.models[MOON_ROCKS_MODEL];
      updateMoonRocksDisplay(moonRocks.amount.value);
    }
  }
}

function updatePositionDisplay(x, y) {
  const positionDisplay = document.getElementById('position-display');
  if (positionDisplay) {
    positionDisplay.textContent = `Position: (${x}, ${y})`;
  }
}

function updateMovesDisplay(remaining) {
  const movesDisplay = document.getElementById('moves-display');
  if (movesDisplay) {
    movesDisplay.textContent = `Moves remaining: ${remaining}`;
  }
}

function updateGameDisplay(game) {
  // Update individual game stats
  const healthDisplay = document.getElementById('health-display');
  if (healthDisplay) {
    healthDisplay.textContent = `Health: ${game.health.value}`;
  }

  const pointsDisplay = document.getElementById('points-display');
  if (pointsDisplay) {
    pointsDisplay.textContent = `Points: ${game.points.value}`;
  }

  const multiplierDisplay = document.getElementById('multiplier-display');
  if (multiplierDisplay) {
    const multiplierValue = (game.multiplier.value / 100).toFixed(1);
    multiplierDisplay.textContent = `Multiplier: ${multiplierValue}x`;
  }

  const cheddahDisplay = document.getElementById('cheddah-display');
  if (cheddahDisplay) {
    cheddahDisplay.textContent = `Cheddah: ${game.cheddah.value}`;
  }

  const levelDisplay = document.getElementById('level-display');
  if (levelDisplay) {
    levelDisplay.textContent = `Level: ${game.current_level.value}`;
  }

  const gameIdDisplay = document.getElementById('game-id-display');
  if (gameIdDisplay) {
    gameIdDisplay.textContent = `Game #${game.game_id.value}`;
  }
}

function updateMoonRocksDisplay(amount) {
  const moonRocksDisplay = document.getElementById('moon-rocks-display');
  if (moonRocksDisplay) {
    moonRocksDisplay.textContent = `Moon Rocks: ${amount}`;
  }

  // Update spawn game button text with cost
  const spawnGameButton = document.getElementById('spawn-game-button');
  if (spawnGameButton) {
    const canAfford = amount >= GAME_ENTRY_COST;
    spawnGameButton.textContent = `Spawn Game (${GAME_ENTRY_COST} Moon Rocks)`;
    if (!canAfford && !spawnGameButton.disabled) {
      spawnGameButton.style.opacity = '0.6';
    } else if (canAfford) {
      spawnGameButton.style.opacity = '1';
    }
  }

  // Show/hide gift button based on moon rocks amount
  const giftButton = document.getElementById('gift-moonrocks-button');
  if (giftButton) {
    if (amount === 0) {
      giftButton.style.display = 'block';
    } else {
      giftButton.style.display = 'none';
    }
  }
}

function initializeMoonRocksDisplay() {
  // Initialize with 0 moon rocks display for new users
  updateMoonRocksDisplay(0);
}

function initGame(account, manifest) {
  // Initialize moon rocks display for new users
  initializeMoonRocksDisplay();
  
  document.getElementById('up-button').onclick = async () => {
    await move(account, manifest, 'up');
  };
  document.getElementById('right-button').onclick = async () => {
    await move(account, manifest, 'right');
  };
  document.getElementById('down-button').onclick = async () => {
    await move(account, manifest, 'down');
  };
  document.getElementById('left-button').onclick = async () => {
    await move(account, manifest, 'left');
  };
  document.getElementById('move-random-button').onclick = async () => {
    await moveRandom(account, manifest);
  };

  document.getElementById('spawn-button').onclick = async () => {
    await spawn(account, manifest);

    document.getElementById('up-button').disabled = false;
    document.getElementById('right-button').disabled = false;
    document.getElementById('down-button').disabled = false;
    document.getElementById('left-button').disabled = false;
    document.getElementById('move-random-button').disabled = false;
  };

  document.getElementById('spawn-game-button').onclick = async () => {
    await spawnGame(account, manifest);
  };

  document.getElementById('gift-moonrocks-button').onclick = async () => {
    await giftMoonRocks(account, manifest);
  };
}

async function spawn(account, manifest) {
  const tx = await account.execute({
    contractAddress: manifest.contracts.find((contract) => contract.tag === ACTION_CONTRACT)
      .address,
    entrypoint: 'spawn',
    calldata: [],
  });

  console.log('Transaction sent:', tx);
}

async function move(account, manifest, direction) {
  let calldata;

  // Cairo serialization uses the variant index to determine the direction.
  // Refer to models.cairo in contracts folder.
  switch (direction) {
    case 'left':
      calldata = ['0'];
      break;
    case 'right':
      calldata = ['1'];
      break;
    case 'up':
      calldata = ['2'];
      break;
    case 'down':
      calldata = ['3'];
      break;
  }

  const tx = await account.execute({
    contractAddress: manifest.contracts.find((contract) => contract.tag === ACTION_CONTRACT)
      .address,
    entrypoint: 'move',
    calldata: calldata,
  });

  console.log('Transaction sent:', tx);
}

const VRF_PROVIDER_ADDRESS = '0x15f542e25a4ce31481f986888c179b6e57412be340b8095f72f75a328fbb27b';

// VRF -> we need to sandwitch the `consume_random` as defined here:
// https://docs.cartridge.gg/vrf/overview#executing-vrf-transactions
async function moveRandom(account, manifest) {

  let action_addr = manifest.contracts.find((contract) => contract.tag === ACTION_CONTRACT).address;

  const tx = await account.execute([
    {
      contractAddress: VRF_PROVIDER_ADDRESS,
      entrypoint: 'request_random',
      calldata: [action_addr, '0', account.address],
    },
    {
      contractAddress: action_addr,
      entrypoint: 'move_random',
      calldata: [],
    }
  ]);

  console.log('Transaction sent:', tx);
}

async function spawnGame(account, manifest) {
  const tx = await account.execute({
    contractAddress: manifest.contracts.find((contract) => contract.tag === ACTION_CONTRACT)
      .address,
    entrypoint: 'spawn_game',
    calldata: [],
  });

  console.log('Game spawned transaction sent:', tx);
}

async function giftMoonRocks(account, manifest) {
  const tx = await account.execute({
    contractAddress: manifest.contracts.find((contract) => contract.tag === ACTION_CONTRACT)
      .address,
    entrypoint: 'gift_moonrocks',
    calldata: [],
  });

  console.log('Moon rocks gift transaction sent:', tx);
}

export { initGame, updateFromEntityData };
