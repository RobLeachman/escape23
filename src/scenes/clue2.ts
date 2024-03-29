import 'phaser';
import Slots from "../objects/slots"
import Recorder from "../objects/recorder"
import PlayerUI from './playerUI';

const _SCENENAME = "Clue2";
let myUI: PlayerUI;
let slots: Slots;
let recorder: Recorder;

let roomReturnWall: number; // return here from other scene back button

let viewWall = 0; // production start at 0
let currentWall = -1;
let previousWall = 0;
let updateWall = false;

let clue2backButton: Phaser.GameObjects.Sprite;
let pushButtonMask: Phaser.GameObjects.Sprite;
let stuckButton: Phaser.GameObjects.Sprite;
let redKeyMask: Phaser.GameObjects.Sprite;
let redKey: Phaser.GameObjects.Sprite;

const sequence = [0, 1, 2, 1, 2, 3, 2, 1]; // L R R R L L R L
let position = 0;
let keyTaken = false;

// Scene is room...
const walls = new Array();

export class Clue2 extends Phaser.Scene {
    constructor() {
        super(_SCENENAME);
    }

    create() {
        myUI = this.scene.get("PlayerUI") as PlayerUI;
        this.scene.bringToTop();
        this.scene.bringToTop("PlayerUI");
        myUI.setActiveScene(_SCENENAME);
        var camera = this.cameras.main;
        camera.setPosition(0, myUI.getCameraHack());

        slots = myUI.getSlots();
        recorder = slots.recorder;
        const thisscene = this;
        this.registry.set('clue2state', 0);

        // Record all clicks on this scene
        // @ts-ignore   pointer is unused until we get fancy...
        this.input.on('gameobjectdown', function (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) {
            recorder.recordObjectDown((gameObject as Phaser.GameObjects.Sprite).name, thisscene);
        });
        this.registry.events.on('changedata', this.registryUpdate, this);

        clue2backButton = this.add.sprite(300, 875 + 15, 'atlas', 'arrowDown.png').setOrigin(0, 0).setName("clue2backButton").setDepth(1);
        recorder.addMaskSprite('clue2backButton', clue2backButton);
        clue2backButton.on('pointerdown', () => {
            viewWall = previousWall;
            recorder.recordObjectDown(clue2backButton.name, thisscene); // must record, won't be captured by global method
            clue2backButton.removeInteractive(); // fix up the cursor displayed on main scene

            this.scene.moveUp("PlayGame");
            this.scene.sleep();
            this.scene.wake("PlayGame");
        });

        pushButtonMask = this.add.sprite(240, 672, 'atlas', 'clue2-button-mask.png').setOrigin(0, 0).setName("pushButtonMask").setDepth(1);
        recorder.addMaskSprite('pushButtonMask', pushButtonMask);
        pushButtonMask.on('pointerdown', () => {
            position++;
            if (position > sequence.length - 1)
                position = 0;
            viewWall = sequence[position];
            this.registry.set('clue2state', viewWall);
            this.sound.play('sfx', { name: 'snick', start: 6, duration: .2 });
        });
        pushButtonMask.setVisible(true); pushButtonMask.setInteractive({ cursor: 'pointer' });
        stuckButton = this.add.sprite(240, 672, 'atlas', 'clue2 button stuck.png').setOrigin(0, 0).setDepth(1).setVisible(false);

        redKeyMask = this.add.sprite(125, 460, 'atlas', 'clue2-button-mask.png').setOrigin(0, 0).setName("redKeyMask").setDepth(1);
        recorder.addMaskSprite('redKeyMask', redKeyMask);
        redKeyMask.on('pointerdown', () => {
            keyTaken = true;
            slots.addIcon("icon - red keyB.png", "objRedKeyB", "altobjRedKeyB", true);
            updateWall = true;
            redKey.setVisible(false);
            stuckButton.setVisible(false);
            //console.log("clue 2 position " + position)
            position = 6; // even more tricky, at the cost of an invalid pattern the first time
            myUI.didGoal('takeKeyFromTeal');
        });
        redKeyMask.setVisible(true); redKeyMask.setInteractive({ cursor: 'pointer' });
        redKey = this.add.sprite(296, 556, 'atlas', 'red key half.png').setOrigin(0, 0).setDepth(1).setVisible(false);

        updateWall = true;
        this.events.on('wake', () => {
            //console.log(`${_SCENENAME} awakes! return to ${roomReturnWall}`)
            this.scene.bringToTop();
            this.scene.bringToTop("PlayerUI")
            myUI.setActiveScene(_SCENENAME);

            viewWall = roomReturnWall;
            updateWall = true;
        });
    }

    update() {
        if ((viewWall != currentWall || updateWall)) {
            roomReturnWall = viewWall;
            currentWall = viewWall;
            updateWall = false;

            pushButtonMask.setInteractive({ cursor: 'pointer' });

            stuckButton.setVisible(false);
            redKeyMask.setVisible(false);
            if (viewWall == 2 && !keyTaken) {
                stuckButton.setVisible(true);
                pushButtonMask.removeInteractive();
                redKeyMask.setVisible(true);
                redKey.setVisible(true);
                myUI.didGoal('openTeal');
            }

            walls[previousWall].setVisible(false);
            walls[viewWall].setVisible(true);
            previousWall = viewWall;
            clue2backButton.setVisible(true); clue2backButton.setDepth(1); clue2backButton.setInteractive({ cursor: 'pointer' });
        }

        // Record any movement or clicks
        if (recorder.getMode() == "record")
            recorder.checkPointer(this);
    }

    preload() {
        walls[0] = this.add.image(0, 0, "clue2 closed").setOrigin(0, 0).setVisible(false);
        walls[1] = this.add.image(0, 0, "clue2 left").setOrigin(0, 0).setVisible(false);
        walls[2] = this.add.image(0, 0, "clue2 open").setOrigin(0, 0).setVisible(false);
        walls[3] = this.add.image(0, 0, "clue2 right").setOrigin(0, 0).setVisible(false);
    }

    // @ts-ignore
    registryUpdate(parent: Phaser.Game, key: string, data: any) {
        //console.log(`${_SCENENAME} registry update ${key}`)
        if (key == "replayObject") {
            const spriteName = data.split(':')[0];
            const spriteScene = data.split(':')[1];
            if (spriteScene == _SCENENAME) {
                let object = recorder.getMaskSprite(spriteName);
                object?.emit('pointerdown')
            }
        }
    }
}
