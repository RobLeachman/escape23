import 'phaser';
import Slots from "../objects/slots"
import Recorder from "../objects/recorder"

var recorder: Recorder;

let viewWall = 0;
let currentWall = -1;
let previousWall = -1;
let previousWallHack: number; // need a hack because battery views are walls not sprites
let updateWall = false;

const walls = new Array();
walls[0] = "zotTableOff";
walls[1] = "zotTableBack";
walls[2] = "zotTableOffFlipped";
walls[3] = "zotTableBackFlipped";

// these regions are so big I suppose won't bother with sprites
walls[7] = "zotBatteryClosed";
walls[8] = "zotBatteryEmpty";
walls[9] = "zotBatteryPlaced";

const zotState = new Array();
zotState[0] = "zotStateOff";
zotState[1] = "zotStateYellow";
zotState[2] = "zotStateGreen";
zotState[3] = "zotStateKey";
zotState[4] = "zotStateEmpty";

const zotStateFlipped = new Array();
zotStateFlipped[0] = "zotStateFlippedGreen"; // impossible, upside down green is red
zotStateFlipped[1] = "zotStateFlippedYellow";
zotStateFlipped[2] = "zotStateFlippedRed";

let zotDrawerState = 0;
let batteryPlaced = false;
let drawerOpen = 0;
let keyTaken = false;

let zotBackButton: Phaser.GameObjects.Sprite;
let backFrontButton: Phaser.GameObjects.Sprite;
let topBottomButton: Phaser.GameObjects.Sprite;
let batteryMask: Phaser.GameObjects.Sprite;

let zotPlaced: Phaser.GameObjects.Sprite;
let zotPlacedFlipped: Phaser.GameObjects.Sprite;
let zotBottomMask: Phaser.GameObjects.Sprite;
let zotTopMask: Phaser.GameObjects.Sprite;
let zotDrawerMask: Phaser.GameObjects.Sprite;

let zotObjectMask: Phaser.GameObjects.Sprite; // TODO should be a way to make this common but I got tired
var zot_flipIt = false;

let haveZot = false;

var slots: Slots;
var plusButton: Phaser.GameObjects.Sprite;
var plusModeButton: Phaser.GameObjects.Sprite;

let lastKeyDebouncer = "";

export class ZotTable extends Phaser.Scene {
    constructor() {
        super("ZotTable");
    }
    create(data: {
        slots: Slots,
        plusButton: Phaser.GameObjects.Sprite,
        plusModeButton: Phaser.GameObjects.Sprite
    }) {
        slots = data.slots;
        plusButton = data.plusButton;
        plusModeButton = data.plusModeButton;

        recorder = slots.recorder;
        // SCENERECORD: Capture all mask clicks on this scene

        this.registry.events.on('changedata', this.zotUpdateData, this);

        let thisscene = this;
        // @ts-ignore   pointer is unused until we get fancy...
        this.input.on('gameobjectdown', function (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) {
            recorder.recordObjectDown((gameObject as Phaser.GameObjects.Sprite).texture.key, thisscene);
        });

        this.registry.set('boxHasZot', haveZot);
        this.registry.set('boxColor', "off");

        zotBackButton = this.add.sprite(300, 875, 'zotBackButton').setOrigin(0, 0);
        recorder.addMaskSprite('zotBackButton', zotBackButton);
        zotBackButton.setVisible(true);

        zotBackButton.on('pointerdown', () => {
            //console.log(`go back from ${viewWall} to ${previousWall}, previous battery wall is ${previousWallHack}`)

            // the global call for this may or may not fire
            //console.log("MAY OR MAY NOT")
            if (viewWall < 7)
                recorder.recordObjectDown(zotBackButton.texture.key, thisscene);

            slots.currentMode = "room";
            zotObjectMask.setVisible(false);
            if (previousWall == -1) {
                zotBackButton.setVisible(false);
                zotBackButton.removeInteractive(); // fix up the cursor displayed on main scene

                this.scene.moveUp("PlayGame");
                this.scene.sleep();
                this.scene.wake("PlayGame");
            } else if (viewWall > 6) { // battery closeup
                //console.log(`will exit from ${viewWall} after returning to ${previousWall}`)
                viewWall = previousWall;
                previousWall = -1;
                //updateWall = true;
            } else if (viewWall == 5 || viewWall == 6) {
                //console.log("still struggling")
                viewWall = previousWall;
            }
            //console.log(`now go view ${viewWall} and previous ${previousWall}`)
            // need a hack here for returning from looking at an object while viewing a battery wall... ugh
            if (viewWall == previousWall) {
                //console.log("HACK " + previousWallHack);
                previousWall = previousWallHack
            }
        });

        backFrontButton = this.add.sprite(65, 625, 'backFrontButton'); // forgot setOrigin so fudged this in
        recorder.addMaskSprite('backFrontButton', backFrontButton);
        backFrontButton.on('pointerdown', () => {
            if (viewWall == 0)
                viewWall = 1;
            else if (viewWall == 1)
                viewWall = 0;
            else if (viewWall == 2)
                viewWall = 3;
            else if (viewWall == 3)
                viewWall = 2;
        });

        topBottomButton = this.add.sprite(360, 315, 'topBottomButton'); // fudge, forgot setOrigin
        recorder.addMaskSprite('topBottomButton', topBottomButton);
        topBottomButton.on('pointerdown', () => {
            if (viewWall == 0)
                viewWall = 2;
            else if (viewWall == 2)
                viewWall = 0;
            else if (viewWall == 1)
                viewWall = 3;
            else if (viewWall == 3)
                viewWall = 1;
        });

        zotPlaced = this.add.sprite(302, 483, 'zotPlaced').setOrigin(0, 0);
        zotPlacedFlipped = this.add.sprite(293, 478, 'zotPlacedFlipped').setOrigin(0, 0);

        zotTopMask = this.add.sprite(294, 466, 'zotTopMask').setOrigin(0, 0);
        recorder.addMaskSprite('zotTopMask', zotTopMask);
        zotTopMask.on('pointerdown', () => {
            if (slots.getSelected() == "objZot") {
                //console.log("ADD IT")
                slots.clearItem("objZot")
                slots.clearSelect();
                haveZot = true;
                this.registry.set('boxHasZot', haveZot);
                updateWall = true;
            }
        });

        zotBottomMask = this.add.sprite(298, 450, 'zotBottomMask').setOrigin(0, 0);
        recorder.addMaskSprite('zotBottomMask', zotBottomMask);
        zotBottomMask.on('pointerdown', () => {
            //console.log("bottom mask return to " + viewWall)
            previousWall = viewWall;
            previousWallHack = viewWall;
            viewWall = 7;
        });

        zotDrawerMask = this.add.sprite(134, 659, 'zotDrawerMask').setOrigin(0, 0);
        recorder.addMaskSprite('zotDrawerMask', zotDrawerMask);
        zotDrawerMask.on('pointerdown', () => {
            //console.log("open the drawer!")
            if (drawerOpen == 1) {
                keyTaken = true;
                drawerOpen = 2;
                slots.addIcon("iconKeyA", "objKeyA", "altobjKeyA");
            }
            if (!keyTaken) {
                //console.log("can take it")
                drawerOpen = 1;
            }
            updateWall = true;
        });

        batteryMask = this.add.sprite(90, 307, 'batteryMask').setOrigin(0, 0);
        recorder.addMaskSprite('batteryMask', batteryMask);
        batteryMask.on('pointerdown', () => {
            //console.log("viewing " + viewWall)
            if (viewWall == 9) { // cover open, battery placed
                viewWall = 7;
            } else if (viewWall == 8) { // cover open, empty
                if (slots.getSelected() == "objBattery") {
                    slots.clearItem("objBattery")
                    slots.clearSelect();
                    batteryPlaced = true;
                    viewWall = 9;
                } else {
                    viewWall = 7;
                }
                updateWall = true;
            } else if (viewWall == 7) { // cover closed
                viewWall = 8;
                if (batteryPlaced)
                    viewWall = 9;
            }
        });


        zotObjectMask = this.add.sprite(170, 410, 'zotObjectMask').setOrigin(0, 0);
        recorder.addMaskSprite('zotObjectMask', zotObjectMask);

        // Flip object over. TODO: must adjust for key presence if it's the plate. Awkward! ??????
        zotObjectMask.on('pointerdown', () => {
            zot_flipIt = true;
            slots.inventoryViewSwitch = true;
        });

        this.events.on('wake', () => {
            viewWall = 0;
            previousWallHack = -1;
            updateWall = true;
        });

        this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
            if (event.key == lastKeyDebouncer)
                return;
            //console.log("keycode " + event.key)
            lastKeyDebouncer = event.key;
            switch (event.key) {
                case "1":
                    haveZot = !haveZot;
                    updateWall = true;
                    break;
                case "2":
                    zotDrawerState++;
                    if (zotDrawerState > 4)
                        zotDrawerState = 0;
                    updateWall = true;
                    break;
            }

        });

    }

    // @ts-ignore
    // data will be boolean or number, so any here is legit!
    zotUpdateData(parent: Phaser.Game, key: string, data: any) {
        if (key == "zotReplayObject") {
            //console.log("ZOT OBJECT replay=" + data)
            let object = recorder.getMaskSprite(data);
            //console.log(object);
            object?.emit('pointerdown')
        }
    }

    update() {
        // Be sure we have the pointer, and then record any movement or clicks
        if (recorder.getMode() == "record") {
            recorder.fixPointer(this.input.activePointer)
            recorder.checkPointer(this);
        }

        if (slots.inventoryViewSwitch) {
            //console.log(`Zot Item View   view=${viewWall} previous=${previousWall}`)
            slots.currentMode = "item"; // so slots object knows we switched

            // Turn off room navigation. If viewing a wall, return to the same wall
            backFrontButton.setVisible(false);
            topBottomButton.setVisible(false);

            //if (previousWall < 5 && previousWall != 6) {
            if (viewWall < 5 || viewWall > 6) {
                // inspecting an object and not from a battery wall...
                //console.log(`set previous=${viewWall}`)
                previousWall = viewWall;
            }

            // ZOT ROOM IMPLEMENTATION //   

            if (currentWall == 5 && zot_flipIt) { // they just clicked the object, show alt view
                slots.setSearched(true);
                this.add.image(0, 0, slots.inventoryViewAlt).setOrigin(0, 0);
                viewWall = 6; currentWall = 6;
            } else {
                this.add.image(0, 0, slots.inventoryViewObj).setOrigin(0, 0);
                viewWall = 5; currentWall = 5;
            }
            zot_flipIt = false;

            slots.displayInventoryBar(true);
            slots.inventoryViewSwitch = false;

            zotBackButton.setVisible(true); zotBackButton.setDepth(10010); zotBackButton.setInteractive({ cursor: 'pointer' });
            plusButton.setVisible(true); plusButton.setDepth(10010); plusButton.setInteractive();

            if (!slots.getSearched()) {
                slots.displayInterfaceClueFull(true);
                slots.displayInterfaceClueCombine(false);
            } else {
                if (!slots.getCombined()) {
                    slots.displayInterfaceClueCombine(true);
                    slots.displayInterfaceClueFull(false);
                }
            };
            if (slots.inventoryViewObj == "objRoach") {
                slots.displayInterfaceClueFull(false);
                slots.displayInterfaceClueCombine(false);
            }

            // turn off all scene masks, and turn on the object alternate view mask
            batteryMask.setVisible(false);
            zotTopMask.setVisible(false);
            zotBottomMask.setVisible(false);
            zotDrawerMask.setVisible(false);
            zotPlaced.setDepth(-1);
            zotPlacedFlipped.setDepth(-1);

            zotObjectMask.setVisible(true);
            zotObjectMask.setDepth(1);
            zotObjectMask.setInteractive({ cursor: 'pointer' });

            slots.displayInventoryBar(true);
            slots.inventoryViewSwitch = false;

        } else if ((viewWall != currentWall || updateWall)) {
            slots.displayInterfaceClueFull(false);
            slots.displayInterfaceClueCombine(false);
            //console.log("zot view wall=" + viewWall)
            this.add.image(0, 0, walls[viewWall]).setOrigin(0, 0);

            zotPlacedFlipped.setDepth(-1);
            zotPlaced.setDepth(-1);

            if (viewWall < 4)
                previousWallHack = -1;

            if (viewWall == 0 || viewWall == 2) {
                zotDrawerState = 0;
                if (haveZot)
                    zotDrawerState++;
                if (batteryPlaced)
                    zotDrawerState++;
                if (keyTaken)
                    zotDrawerState = 0;
            }
            this.registry.set('zotBoxColor', zotDrawerState);
            zotDrawerMask.setVisible(false);
            if (viewWall == 0) {
                if (keyTaken)
                    drawerOpen = 0;
                if (drawerOpen == 1) {
                    this.add.image(134, 659, zotState[3]).setOrigin(0, 0);
                    zotDrawerMask.setVisible(true); zotDrawerMask.setDepth(1); zotDrawerMask.setInteractive({ cursor: 'pointer' });
                } else if (drawerOpen == 2) {
                    this.add.image(134, 659, zotState[4]).setOrigin(0, 0);
                } else {
                    this.add.image(134, 659, zotState[zotDrawerState]).setOrigin(0, 0);
                    if (haveZot)
                        zotPlaced.setDepth(1);
                    if (zotDrawerState == 2) { // green, now let it be opened
                        zotDrawerMask.setVisible(true); zotDrawerMask.setDepth(1); zotDrawerMask.setInteractive({ cursor: 'pointer' });
                    }
                }

            }
            if (viewWall == 2) {
                if (zotDrawerState > 0)
                    this.add.image(153, 664, zotStateFlipped[zotDrawerState]).setOrigin(0, 0);
            }

            backFrontButton.setVisible(false);
            topBottomButton.setVisible(false);

            if (viewWall < 4) {
                backFrontButton.setVisible(true); backFrontButton.setDepth(1); backFrontButton.setInteractive({ cursor: 'pointer' });
                topBottomButton.setVisible(true); topBottomButton.setDepth(1); topBottomButton.setInteractive({ cursor: 'pointer' });
            }
            zotBackButton.setVisible(true); zotBackButton.setDepth(1); zotBackButton.setInteractive({ cursor: 'pointer' });

            if (viewWall == 1) {
                if (haveZot)
                    zotPlacedFlipped.setDepth(2);
            }

            zotTopMask.setVisible(false);
            if ((!haveZot) && (viewWall == 0 || viewWall == 1)) {
                zotTopMask.setVisible(true); zotTopMask.setDepth(1); zotTopMask.setInteractive({ cursor: 'pointer' });
            }

            zotBottomMask.setVisible(false);
            if (viewWall == 2 || viewWall == 3) {
                zotBottomMask.setVisible(true); zotBottomMask.setDepth(1); zotBottomMask.setInteractive({ cursor: 'pointer' });
            }
            batteryMask.setVisible(false);
            if (viewWall > 3)
                batteryMask.setVisible(true); batteryMask.setDepth(1); batteryMask.setInteractive({ cursor: 'pointer' });

            plusButton.setVisible(false);
            plusModeButton.setVisible(false);
        }

        this.scene.setVisible(true, "BootGame");
        slots.displaySlots(30005);

        currentWall = viewWall;
        updateWall = false;
    }
}
