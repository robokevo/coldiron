'use strict';

let gameData = {
    name: "Moon Miners",
    version: "0.00",
    session:    null, // will eventually hold live game data
    // keep widths and heights even! messes w/ display math otherwise
    // to-do: prevent errors if stage is smaller than display
    maxDisplayWidth:  60,
    maxDisplayHeight: 30,
    stageWidth: 70,
    stageHeight: 40,
    colors: ['rgb(0, 255, 0)', 'rgb(10, 30, 50)', ],
    stageDepth: 1,
    stageOptions: {},
    screenData: {
        start:  {
            name:   'Start',
        },
        menu:   {
            name:   'Menu',
        },
        play:   {
            name:   'Play',
            origin: {
                x: 0,
                y: 0
            },
            colors: ['rgb(0, 255, 0)', 'rgb(10, 30, 50)'],
        },
    }
};

///////////////////////////////////////////////////////////////////
// Tile data
gameData.tileData = {
    floorTile: {
        character:  '.',
        foreground: 'goldenrod',
        background: 'black',
    },
    wallTile: {
        character: '#',
        foreground: 'blue',
        background: 'black'
    },
};


////////////////////////////////////////////////////////////////////
// "Start" screen data

// "Start" screen command list
gameData.screenData.start.commands = {
    keys:   {
        any: ()=>console.log('any?'),
        enter: 'switch:menu',
    },
    shortcuts: {
        'ctrl,z':   ()=>console.log('undo?'),
    },
    sequences: {
        'up,down,left,right,b,a,enter': ()=>console.log('baby konami'),
    }
};

// "Start" screen renderer
gameData.screenData.start.render = (main, display) => {
    display.drawText(9,9, "start!");
};

////////////////////////////////////////////////////////////////////
// "Menu" screen data

// "Menu" command list
gameData.screenData.menu.commands = {
    keys:   {
        x:  ()=>console.log(this),
        y:  ()=>console.log('whyyyyyyyyy'),
        any: ()=>console.log('any!'),
        esc: 'switch:start',
        enter: 'switch:play',
    },
    shortcuts: {
        'ctrl,z':   ()=>console.log('undo!'),
    },
    sequences: {
        'up,down,left,right,b,a': ()=>console.log('baby konamiiiiii'),
    }
};

// "Menu" screen renderer
gameData.screenData.menu.render = (main, display) => {
    display.drawText(9,9, "menu!");
};

////////////////////////////////////////////////////////////////////
// "Play" screen data

// "Play" command list
gameData.screenData.play.commands = {
    //player: main.world.player,
    keys:   {
        1:  (main)=>console.log(main.world.findInRange(main.world.player, 1, 'floor')),
        2:  (main)=>console.log(main.world.findInRange(main.world.player, 1, 'entity')),
        3:  (main)=>console.log(main.world.findInRange(main.world.player, 2, 'floor')),
        4:  (main)=>console.log(main.world.findInRange(main.world.player, 2, 'entity')),
        5:  (main)=>console.log(main.world.findInRange(main.world.player, 3, 'floor')),
        6:  (main)=>console.log(main.world.findInRange(main.world.player, 3, 'entity')),
        g:  (main)=>console.log(
                main.world.getEntityAt(
                    main.screen.player.x,
                    main.screen.player.y)
                ),
        y:  (main)=>
            console.log(
                main.screen._cursorX,
                main.screen._cursorY
            ),
        z:  (main)=>
            console.log(main.world.getRandomFloorXY()
        ),
        any: (main)=>console.log('any!'),
        esc: 'switch:menu',
        up: (main) => main.screen.move(0,-1),
        down: (main) => main.screen.move(0,1),
        left: (main) => main.screen.move(-1,0),
        right: (main) => main.screen.move(1,0),
    },
    shortcuts: {
        'ctrl,z':   ()=>console.log('undo!'),
    },
    sequences: {
        'up,down,left,right,b,a': ()=>console.log('baby konamiiiiii'),
    }
};

//
// "Play" enter screen
gameData.screenData.play.enter = (main) => {
    // initialize stage data
    let screen = main.screen;
    let stages;
    if (main._world === undefined) {
        let player = new coldIron.Entity(gameData.entityData.player);
        screen.player = player;
        main.makeWorld(gameData, player);
        stages = main.world.stages;
        main.world.engine.start();
    }
    let stage = main.world.stage;
    screen.stage = stage;
    screen.screenWidth = screen.displayWidth;
    screen.screenHeight = screen.displayHeight;
    screen.stageWidth = stage.width;
    screen.stageHeight = stage.height;
    screen.columnX = 10;
};

// "Play" screen renderer
gameData.screenData.play.render = function (main, display) {
    let screen = main.screen;
    let title = main.name + " v. " + main.version;
    let xPos = screen.origin.x + Math.round(screen.screenWidth/2 - title.length/2);
    display.drawText(xPos, screen.origin.y, title);
};

gameData.screenData.play.panelData = {
    stage: {
        name: 'Stage',
        origin: {x:undefined,y:undefined},
        width: 40,
        height: 20,
        fgColor: 'rgb(200,200,200)',

        enter: function(main) {
            this.origin.x = Math.round((this.displayWidth-(this.width)-1));
            this.origin.y = 2;
            this.center.x = Math.round(this.origin.x + this.width/2);
            this.center.y = Math.round(this.origin.y + this.height/2);
            let title = '%c{' + this.fgColor + "}Level " + (main.world.level+1);
            let titleXY = {y: 1};
            titleXY.x = this.origin.x + Math.round(
                this.width/2 - (title.length-20)/2);
            main.display.drawText(titleXY.x, titleXY.y, title, this.fgColor);
        },

        render: function(main, display) {
            let screen = main.screen;
            let stage = screen.stage;
            this.stageCenter = main.world.player;
            this.offset.x = this.stageCenter.x - this.center.x;
            this.offset.y = this.stageCenter.y - this.center.y;
            let entities = main.world.entities;
            let tile, entity;
            for (let x = this.origin.x; x < this.origin.x+this.width; x++) {
                for (let y = this.origin.y; y < this.origin.y+this.height; y++) {
                    tile = main.world.getTile(x+this.offset.x, y+this.offset.y);
                    display.draw(x, y, 
                        tile.character,
                        tile.fgColor,
                        tile.bgColor);
                }
            }
            for (let i = 0; i < entities.length; i++) {
                entity = entities[i];
                if (entity.x - this.offset.x > this.origin.x &&
                    entity.x - this.offset.x < (this.origin.x + this.width) &&
                    entity.y - this.offset.y > this.origin.y &&
                    entity.y - this.offset.y < (this.origin.y + this.height)) {
                    display.draw(
                        entity.x - this.offset.x,
                        entity.y - this.offset.y,
                        entity.character,
                        entity.fgColor,
                        entity.bgColor);
                }
            }
        },
    },
    info: {
        name: 'Info',
        origin: {x:0,y:0}
    }
};

/////////////////////////////////////////////////////////////
// Attribute mixin data
gameData.attributeData = {};

gameData.attributeData.playerActor = {
    name: 'playerActor',
    groupName: 'actor',
    act: function() {
        // re-render screen
        // to-do: only re-render scene panel
        // Lock engine and wait asynchronously
        // for player to press key
        // to-do: replace lock w/ async/await function
        // to-do: only trigger when on same floor
        // to-do: determine if more rendering needs to happen
        this.world.main.screen._render(this.world.main.display);
        this.world.engine.lock();        
    }
};

gameData.attributeData.fungusActor = {
    name: 'fungusActor',
    groupName: 'actor',
    init: function() {
        this._spawnRemaining = 3;
    },
    act: function() {
        // check if growing this turn
        // to-do: split into spawning function
        if (this._spawnRemaining > 0) {
            if (Math.random() <= 0.005) {
                // Find coordinates of random neighbor square
                let targets = this.world.findInRange(this, 1, 'floor');
                if (targets.length > 0) {
                    let index = Math.floor(Math.random()*targets.length);
                    let target = targets[index];
                    let entity = new coldIron.Entity(gameData.entityData.fungus);
                    entity.x = target.x;
                    entity.y = target.y;
                    this.world.sendMessageInRange(this, 5, 'it spreadin!');
                    this.world.addEntity(entity);
                    this._spawnRemaining--;
                }
            }
        } 
    }
};

gameData.attributeData.mobile = {
    // to-do: more interactions on bump
    name:   'mobile',
    tryMove: function(x, y, stage) {
        let tile;
        let target;
        if (stage.contains(x, y)) {
            tile = stage.getValue(x, y);
            target = this.world.getEntityAt(x, y);
            if (target) {
                if (this.hasAttribute('attacker')) {
                    this.attack(target);
                //    return true;
                }
            // check if tile is traversable before walking
            } else if (tile.traversable){
                this._x = x;
                this._y = y;
            //    return true;
            // or see if tile is destructible
            // to-do: make incumbent on skill or tool
            } else if (tile.destructible) {
                this.world.destroy(x, y);
            //    return true;
            }
        } 
        //return false;
        this.continue();
    }
};

gameData.attributeData.destructible = {
    // to-do: wire walls and floors with this
    // to-do: react() on takeDamage()
    name:   'destructible',
    init: function(template) {
        this._maxHp = template.maxHp || 10;
        this._hp = template.hp || this._maxHp;
        this._defense = template.defense || 0;
    },
    // to-do: factor in temp hp from buffs
    getHp:  function() {
        return this._hp;
    },
    setHp: function(hp) {
        this._hp += hp;
    },
    getMaxHp:   function() {
        return this._maxHp;
    },
    // to-do: factor in buffs/armor
    getDefense: function() {
        return this._defense;
    },
    takeDamage: function(attacker, damage) {
        this.setHp(-damage);
        // If 0 or less HP, remove selves from map
        if (this.getHp() <= 0) {
            this.world.sendMessage(attacker, 'You kill the [monster]');
            this.world.sendMessage(this, 'You were killed by [killer]');
            this.world.removeEntity(this);
        }
    }
};

gameData.attributeData.attacker = {
    name: 'attacker',
    groupName: 'attacker',
    init: function(template) {
        this._strength = template.strength || 1;
    },
    getAtkPower: function() {
        return this._strength;
    },
    attack: function(target) {
        // only attack if attackable
        if (target.hasAttribute('destructible')) {
            let attack = this.getAtkPower();
            let defense = target.getDefense();
            var maxDmg = Math.max(0, attack - defense);

            this.world.sendMessage(this, 'You strike the [monster] for [damage]');
            this.world.sendMessage(target, 'The [attacker] strikes you for [damage]');

            target.takeDamage(this, 1 + Math.floor(Math.random() * maxDmg));
        }
        this.continue();
    }
};

gameData.attributeData.messageRecipient = {
    name: 'messageRecipient',
    init:   function(template) {
        this._messages = [];
    },
    receiveMessage: function(message) {
        this._messages.push(message);
    },
    getMessages:    function(message) {
        return this._messages;
    },
    clearMessages:  function() {
        this._messages = [];
    },
};

/////////////////////////////////////////////////////
// Entity data
gameData.entityData = {};

gameData.entityData.player = {
    character: '@',
    fgColor: 'white',
    bgColor: 'black',
    strength: 6,
    attributes: [
        gameData.attributeData.mobile,
        gameData.attributeData.playerActor,
        gameData.attributeData.attacker,
        gameData.attributeData.destructible,
        gameData.attributeData.messageRecipient,
    ]
};

gameData.entityData.fungus = {
    name: 'fungus',
    character: 'F',
    fgColor: 'green',
    maxHp:  5,
    defense: 0,
    attributes: [
        gameData.attributeData.fungusActor,
        gameData.attributeData.destructible,
    ]
};