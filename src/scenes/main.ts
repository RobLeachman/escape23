import 'phaser';
import Slots from "../objects/slots"
import Recorder from "../objects/recorder"
import PlayerUI from './playerUI';

import DiscordWebhook from 'discord-webhook-ts';

// Discord web hook, a slam dunk. The hardest part is not having it be deleted on commit and I'll tackle that later. 
// Please don't delete my webhook. Thanks.
// https://www.npmjs.com/package/discord-webhook-ts
// https://discohook.org
const d1 = 'https://discord.com/api/webhooks';
const d2 = '1096536501413761125';
const d3 = '_jdNDh2X_cgHwfnWSaXn4-ekCWvuaXAHbjDsj7p-mEbUmeJ8o1DbgPJx2nLi60Zu78VB';
const discordClient = new DiscordWebhook(d1 + '/' + d2 + '/' + d3);

let myUI: PlayerUI;
let slots: Slots;
let recorder: Recorder;

let debugUpdateOnce = false;
let debugPanel = false; // debug panel on top of screen

var viewWall = 2; // production start at 2
var currentWall = -1;
var previousWall = -1;
var updateWall = false;
let roomReturnWall: number; // return here from other scene back button

const walls = new Array();
const icons = new Array();
const obj = new Array();
const altObj = new Array();
const tableView = new Array();
const closeView = new Array();
const clue2states = new Array();

let leftButton: Phaser.GameObjects.Sprite;
let rightButton: Phaser.GameObjects.Sprite;
let backButton: Phaser.GameObjects.Sprite;

let mobile: boolean;

let takeMask: Phaser.GameObjects.Sprite;
let tableMask: Phaser.GameObjects.Sprite;
let doorMask: Phaser.GameObjects.Sprite;
let rangerMask: Phaser.GameObjects.Sprite;
let funzMask: Phaser.GameObjects.Sprite;
let rylandMask: Phaser.GameObjects.Sprite;

var battMask: Phaser.GameObjects.Sprite;

var fiveMask: Phaser.GameObjects.Sprite;
var fiveOpen: Phaser.GameObjects.Sprite;
var fiveBatt: Phaser.GameObjects.Sprite;
var twoDoorMask: Phaser.GameObjects.Sprite;

var clue2Mask: Phaser.GameObjects.Sprite;

let twoDoorUnlockedWall: Phaser.GameObjects.Image;

var tableState = 0;

let egress = false;
let begButton: Phaser.GameObjects.Sprite;

let clue2Init = true;
let clue2state = 0;
let twoDoorUnlocked = false;

var fiveInit = true;
var twoInit = true;

var viewportText: Phaser.GameObjects.Text;

let initMain = true;

let zoomSpeed = { zoomSlow: 500, zoomMedium: 750, zoomFast: 1200 };

export class PlayGame extends Phaser.Scene {
    constructor() {
        super("PlayGame");
    }

    async update() {
        // did we just hit the keyboard to start replaying?
        if (this.input.activePointer.rightButtonDown() && location.hostname == "localhost") {
            console.log("right mouse button action! bounce bounce");
            slots.addIcon("icon - red key.png", "objRedKey", "altobjRedKey");
        }

        if (initMain) {

            /* released it baby!
            if (location.hostname == "localhost" && !(recorder.getMode() == "replay" || recorder.getMode() == "replayOnce")) {
                //console.log("BONUS TEST ZOTS")
                slots.addIcon("icon - red key.png", "objRedKey", "altobjRedKey");
                slots.addIcon("icon - keyWhole.png", "objKeyWhole", "altobjKeyWhole");
                //slots.addIcon("iconZot.png", "objZot", "altobjZot"); // it is the zot
                //slots.addIcon("iconBattery.png", "objBattery", "altobjBattery");
                //slots.addIcon("icon - donut.png", "objDonut", "altobjDonut");
                //slots.addIcon("icon - keyA.png", "objKeyA", "altobjKeyA");
                //slots.addIcon("icon - keyB.png", "objKeyB", "altobjKeyB");
                slots.addIcon(icons[6], obj[6], altObj[6], false, 11); // roach
            }
            */
            
            initMain = false;
        }

        if (debugUpdateOnce) {
            debugUpdateOnce = false;
            //var txt = this.add.rexCanvasInput(50, 150, 100, 200, config);
            //this.showRecording();
            return;

        }

        ////////////// MAIN SCENE RECORDER DEBUGGER TEXT //////////////
        let debugTheRecorder = recorder.getMode();
        //if (debugging || debugTheRecorder == "record" || debugTheRecorder == "replay" || debugTheRecorder == "replayOnce") {
        if (debugPanel) {
            let displayDebugMode = "RECORDING!";
            if (debugTheRecorder == "replay" || debugTheRecorder == "replayOnce") {
                displayDebugMode = "REPLAY"
            }
            if (debugTheRecorder == "idleNowReplayOnReload" || debugTheRecorder == "idle")
                displayDebugMode = "IDLE"
            /*

            var pointer: Phaser.Input.Pointer;

            viewportText.setText([
                'x: ' + pointer.worldX,
                'y: ' + pointer.worldY,
                'rightButtonDown: ' + pointer.rightButtonDown(),
                'isDown: ' + pointer.isDown,
                '',
                displayDebugMode + '  time: ' + Math.floor(this.time.now) + '   length: ' + recorder.getSize()
            ]);
            */

            if (displayDebugMode == "REPLAY") {
                viewportText.setText([
                    displayDebugMode + '  time: ' + recorder.getRecordedPlaytime() + '   length: ' + recorder.getSize(),
                    '\nrecorder mode ' + debugTheRecorder
                ]);
            } else {
                viewportText.setText([
                    displayDebugMode + '   length: ' + recorder.getSize(),
                    '\nrecorder mode ' + debugTheRecorder
                ]);
            }
        }


        ////////////// SCENE RECORDER/REPLAY //////////////

        // Be sure we have the pointer, and then record any movement or clicks
        if (recorder.getMode() == "record")
            recorder.checkPointer(this);

        //console.log("Main recorder mode=" + recorder.getMode())

        if (slots.fakeClicks == 3) {
            //console.log("BRING THE ROACH");
            //slots.clearItem(this, "fake");
            slots.fakeClicks = 4;
            slots.addIcon(icons[6], obj[6], altObj[6], false, 11); // roach
            myUI.showClueDebug();
            myUI.dumpConsole();
        }
        if (slots.fakeClicks == 10) {
            slots.addIcon("icon - red key.png", "objRedKey", "altobjRedKey");
            slots.fakeClicks = -1;
            /*
            recorder.setMode("roachReplay");
            
            //console.log("roach replay " + slots.getSelected());
            let selectedThing = slots.getSelected();
            if (selectedThing.thing == "objRoach") {  /// ROACH REPLAY IS BROKEN
                recorder.setReplaySpeed("fast")
            } else {
                recorder.setReplaySpeed("perfect")
            }
            window.location.reload();
            */
        }

        ////////////// ROOM VIEW //////////////

        if ((viewWall != currentWall || updateWall)) {
            roomReturnWall = viewWall;
            currentWall = viewWall;
            updateWall = false;

            fiveOpen.setVisible(false);
            fiveBatt.setVisible(false);

            if (egress) {
                this.add.image(0, 0, walls[8]).setOrigin(0, 0);
                leftButton.setVisible(false);
                rightButton.setVisible(false);
                myUI.hideEye();
                let fadeClicks = 10;
                while (fadeClicks-- > 0) {
                    recorder.fadeClick();
                }

                recorder.setFourPuzzleSolvedOnce(myUI.getFourWayPuzzle()); // bake for a week
                this.sound.play('sfx', { name: 'applause', start: 11, duration: 5 });

                currentWall = viewWall;
                updateWall = false;
                var sentence = "Nice job " + recorder.getPlayerName() + "!\nTry it again for the bonus?\nJust reload the page";
                if (myUI.getBonus()) {
                    this.add.sprite(360, 800, 'atlas', 'winner donutPlated.png');
                    sentence = "You did it :)\n\nThanks for testing!";
                } else {
                    //failed.setDepth(400);
                    //failed.setX(360); failed.setY(800);
                    this.add.sprite(360, 800, 'atlas', 'fail.png').setDepth(100);
                }

                this.sendDiscordWebhook('Winner',
                    recorder.getPlayerName() + '  escaped! ' + recorder.getWinTimeWords() +
                    ' with ' + recorder.getSpoilerCount() + ' spoilers' +
                    ' (' + myUI.getMusicPlayTime() + ')', "", "");

                const style = 'margin: auto; background-color: black; color:white; width: 520px; height: 100px; font: 40px Verdana';
                this.add.dom(350, 1100, 'div', style, sentence);

                const style2 = 'margin: auto; background-color: black; color:#fff; width: 520px; height: 40px; font: 25px Verdana';
                this.add.dom(10, 200, 'div', style2, 'You won in ' + recorder.getWinTimeWords() + ' with ' + recorder.getSpoilerCount() + ' spoilers').setOrigin(0, 0);

                myUI.hideUILayer();
                slots.clearAll();
                takeMask.setVisible(false);
                tableMask.setVisible(false);
                rangerMask.setVisible(false);
                rylandMask.setVisible(false);
                funzMask.setVisible(false);
                clue2Mask.setVisible(false);
                doorMask.setVisible(false);
                battMask.setVisible(false);

                fiveMask.setVisible(false);
                fiveOpen.setVisible(false);
                fiveBatt.setVisible(false);

                myUI.pauseMusic(true);

                updateWall = false;
                viewWall = currentWall;

                // the game is over, now see what comes next...
                if (recorder.getMode() == "replayOnce") {
                    recorder.setMode("idle")
                }

                if (recorder.getMode() == "record") {
                    recorder.setMode("idle")
                    //this.showRecording()
                }

                this.input.on("pointerdown", () => {
                    window.open("fin.html", "_self");
                }, this);

                viewportText.setDepth(-1);
                begButton.setVisible(true); backButton.setDepth(11110); backButton.setInteractive();
                return; // that is all we need to do on egress
            }

            // TODO: should not be adding images willy nilly!
            if (myUI.getDoorUnlocked() && viewWall == 0) {
                this.add.image(0, 0, walls[7]).setOrigin(0, 0);
            } else {
                this.add.image(0, 0, walls[viewWall]).setOrigin(0, 0);
            }

            if (viewWall == 0) {
                this.add.sprite(542, 650, 'atlas', tableView[tableState]).setOrigin(0, 0);
            }

            if (viewWall == 4)
                //this.add.sprite(180, 544, closeView[tableState]).setOrigin(0, 0);
                this.add.sprite(180, 544, 'atlas', closeView[tableState]).setOrigin(0, 0);

            if (viewWall > 3) { // viewing table not room wall, or inventory view
                leftButton.setVisible(false);
                rightButton.setVisible(false);
                backButton.setVisible(true); backButton.setDepth(110); backButton.setInteractive({ cursor: 'pointer' });
            } else {
                leftButton.setVisible(true); leftButton.setDepth(100); leftButton.setInteractive({ cursor: 'pointer' });
                rightButton.setVisible(true); rightButton.setDepth(100); rightButton.setInteractive({ cursor: 'pointer' });
                backButton.setVisible(false);
            }

            tableMask.setVisible(false);
            doorMask.setVisible(false);
            if (viewWall == 0) {
                tableMask.setVisible(true); tableMask.setDepth(100); tableMask.setInteractive({ cursor: 'pointer' });
                doorMask.setVisible(true); doorMask.setDepth(100); doorMask.setInteractive({ cursor: 'pointer' });
                //doorMask.input.cursor = 'url(assets/input/cursors/pen.cur), pointer';
                doorMask.input!.cursor = 'pointer';
            }

            clue2Mask.setVisible(false);
            if (viewWall == 1) {
                clue2Mask.setVisible(true); clue2Mask.setDepth(100); clue2Mask.setInteractive({ cursor: 'pointer' });
                this.add.sprite(343, 595, 'atlas', clue2states[clue2state]).setOrigin(0, 0);
            }

            twoDoorMask.setVisible(false);
            twoDoorUnlockedWall.setVisible(false);
            rangerMask.setVisible(false);
            funzMask.setVisible(false)
            if (viewWall == 2) {
                rangerMask.setVisible(true); rangerMask.setDepth(100); rangerMask.setInteractive({ cursor: 'pointer' });
                funzMask.setVisible(true); funzMask.setDepth(100); funzMask.setInteractive({ cursor: 'pointer' });
                // hintMask.setVisible(true); hintMask.setDepth(100); hintMask.setInteractive({ cursor: 'pointer' }); // ranger
                twoDoorMask.setVisible(true); twoDoorMask.setDepth(100); twoDoorMask.setInteractive({ cursor: 'pointer' });
                if (twoDoorUnlocked)
                    twoDoorUnlockedWall.setVisible(true);
            }

            rylandMask.setVisible(false);
            fiveMask.setVisible(false);
            if (viewWall == 3) {
                rylandMask.setVisible(true); rylandMask.setDepth(100); rylandMask.setInteractive({ cursor: 'pointer' });
                fiveMask.setVisible(true); fiveMask.setDepth(100); fiveMask.setInteractive({ cursor: 'pointer' });

                const fiveState = myUI.getFiveState();
                if (fiveState == 1)
                    fiveBatt.setVisible(true)
                if (fiveState == 2)
                    fiveOpen.setVisible(true);
            }

            if (viewWall == 4) { // the table
                //takeMask.setVisible(true); takeMask.setDepth(100); takeMask.setInteractive();
                //takeMask.input.cursor = 'url(assets/input/cursors/pen.cur), pointer';
                takeMask.setVisible(true); takeMask.setDepth(100);
                // pointer cursor if stuff remains on table, else default, is how this is done
                takeMask.setInteractive();
                if (tableState > 2)
                    takeMask.input!.cursor = 'default';
                else
                    takeMask.input!.cursor = 'pointer';
            } else {
                takeMask.setVisible(false);
            }
        }
    }

    // @ts-ignore
    // data will be boolean or number, so "any" here is legit!
    registryUpdate(parent: Phaser.Game, key: string, data: any) {
        //console.log(`main registry update ${key}`)

        if (key == "clue2state") {
            clue2state = data;
        }

        if (key == "replayObject") {
            const spriteName = data.split(':')[0];
            const spriteScene = data.split(':')[1];
            //console.log(`--> main replay ${spriteScene} ${spriteName}`)
            if (spriteScene == "PlayGame") {
                zoomSpeed = recorder.getPanZoomSpeeds();

                let object = recorder.getMaskSprite(spriteName);
                object?.emit('pointerdown')
            }
        }
    }

    sendDiscordWebhook(postTitle: string, postMessage: string, postDataLabel: string, postData: string) {
        if (postDataLabel.length > 0) {
            discordClient.execute({
                embeds: [
                    {
                        title: postTitle,
                        description: postMessage,
                    },
                    {
                        fields: [
                            {
                                name: postDataLabel,
                                value: postData,
                            }
                        ]
                    }
                ]
                // @ts-ignore
            }).then((response) => {
                //console.log('Successfully sent webhook. ' + response)
                //console.log('Successfully sent webhook')
            })
        } else {
            discordClient.execute({
                embeds: [
                    {
                        title: postTitle,
                        description: postMessage,
                    }
                ]
                // @ts-ignore
            }).then((response) => {
                //console.log('Successfully sent webhook. ' + response)
                //console.log('Successfully sent webhook')
            })

        }
    }

    create(data: {
        mobile: boolean;
    }) {
        mobile = data.mobile;
        //console.log(`main create ${mobile}`)

        myUI = this.scene.get("PlayerUI") as PlayerUI;
        this.scene.bringToTop();
        this.scene.bringToTop("PlayerUI");
        myUI.setActiveScene("PlayGame");
        let camera = this.cameras.main;
        camera.setPosition(0, myUI.getCameraHack());

        slots = myUI.getSlots();

        // may be important later...
        if (mobile) {
            console.log("mobile device")
        }

        this.registry.events.on('changedata', this.registryUpdate, this);
        this.registry.set('replayObject', "0:init"); // need to seed the function in create, won't work without

        let thisscene = this;
        // @ts-ignore   pointer is unused until we get fancy...
        this.input.on('gameobjectdown', function (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) {
            recorder.recordObjectDown((gameObject as Phaser.GameObjects.Sprite).name, thisscene);
        });

        recorder = slots.recorder;
        //console.log("Main create recorder mode: " + recorder.getMode());
        if (recorder.getMode() == "replay" || recorder.getMode() == "replayOnce")
            debugPanel = true;

        zoomSpeed = recorder.getPanZoomSpeeds();

        if (recorder.getPlayerName() != "qqq" && recorder.getPlayerName() != "Quazar")
            this.sendDiscordWebhook('Another victim locked in the room!', recorder.getPlayerName() + ' enters', "Recording", recorder.getRecordingKey() + '.txt');

        leftButton = this.add.sprite(80, 950, 'atlas', 'arrowLeft.png').setName("leftButton");
        recorder.addMaskSprite('leftButton', leftButton);
        rightButton = this.add.sprite(640, 950, 'atlas', 'arrowRight.png').setName("rightButton");
        recorder.addMaskSprite('rightButton', rightButton);
        backButton = this.add.sprite(300, 875, 'atlas', 'arrowDown.png').setOrigin(0, 0).setName("backButton");
        recorder.addMaskSprite('backButton', backButton);

        rightButton.on('pointerdown', () => {
            viewWall++;
            if (viewWall > 3)
                viewWall = 0;
            myUI.didGoal('searchAndSolve');
        });
        leftButton.on('pointerdown', () => {
            viewWall--;
            if (viewWall < 0)
                viewWall = 3;
            myUI.didGoal('searchAndSolve');
        });
        backButton.on('pointerdown', () => {
            //console.log("back to " + previousWall)
            slots.combining = ""; // cancel any combine action
            if (viewWall == 4) { // looking at table
                viewWall = 0;
                myUI.showSettingsButton();
            } else
                viewWall = previousWall;
        });



        // Add item to inventory list when picked up. In this test it's easy, just 3 stacked items.
        // Add it and then remove from view and flag for an update.
        //takeMask = this.add.sprite(155, 530, 'takeMask').setOrigin(0, 0);
        takeMask = this.add.sprite(155, 530, 'atlas', 'takeMask.png').setName("takeMask").setOrigin(0, 0);
        recorder.addMaskSprite('takeMask', takeMask);
        takeMask.on('pointerdown', () => {
            if (tableState < 3) {
                if (tableState == 2)
                    slots.addIcon(icons[10], obj[9], altObj[9], true); // TODO: renumber the objects, used to be simple:
                else
                    slots.addIcon(icons[tableState], obj[tableState], altObj[tableState], true); // TODO: get name from sprite
                this.add.sprite(190, 560, closeView[tableState]).setOrigin(0, 0);
                if (tableState == 1)
                    myUI.didGoal('pickUpPlate')
                if (tableState == 2)
                    myUI.didGoal('getZot');
                tableState++;
                if (tableState > 2) {
                    this.input.setDefaultCursor('default');
                }
                updateWall = true;
            }
        });

        //tableMask = this.add.sprite(440, 615, 'tableMask').setOrigin(0, 0);
        tableMask = this.add.sprite(440, 615, 'atlas', 'tableMask.png').setOrigin(0, 0).setName("tableMask");
        recorder.addMaskSprite('tableMask', tableMask);
        tableMask.on('pointerdown', () => {
            myUI.hideSettings();
            viewWall = 4; roomReturnWall = 4;
            myUI.didGoal('searchDonutTable');
        });

        rangerMask = this.add.sprite(34, 433, 'atlas2', 'rangerMask.png').setOrigin(0, 0).setName("rangerMask");
        recorder.addMaskSprite('rangerMask', rangerMask);
        rangerMask.on('pointerdown', () => {
            myUI.cameraZoom(this, 120, 500, 3.5, zoomSpeed.zoomMedium, zoomSpeed.zoomSlow);
        });

        rylandMask = this.add.sprite(220, 379, 'atlas2', 'rylandMask.png').setOrigin(0, 0).setName("rylandMask");
        recorder.addMaskSprite('rylandMask', rylandMask);
        rylandMask.on('pointerdown', () => {
            myUI.cameraZoom(this, 314, 475, 3.5, zoomSpeed.zoomSlow, zoomSpeed.zoomSlow);
        });

        funzMask = this.add.sprite(600, 690, 'atlas2', 'rangerMask.png').setOrigin(0, 0).setName("funzMask");
        recorder.addMaskSprite('funzMask', funzMask);
        funzMask.on('pointerdown', () => {
            myUI.cameraZoom(this, 674, 773, 28, zoomSpeed.zoomMedium, zoomSpeed.zoomFast);
        });

        clue2Mask = this.add.sprite(340, 634, 'atlas', 'zotTableMask.png').setOrigin(0, 0).setName("clue2Mask");
        recorder.addMaskSprite('clue2Mask', clue2Mask);
        clue2Mask.on('pointerdown', () => {
            roomReturnWall = 1;
            if (clue2Init) {
                clue2Init = false;
                this.scene.launch("Clue2", { slots: slots })
                this.scene.sleep();
            } else {
                this.scene.wake("Clue2");
                this.scene.sleep();
            }
        });

        battMask = this.add.sprite(320, 926, 'atlas', 'battMask.png').setName("battMask").setOrigin(0, 0);
        recorder.addMaskSprite('battMask', battMask);
        battMask.on('pointerdown', () => {
            slots.addIcon(icons[8], obj[7], altObj[7]);
            updateWall = true;
        });


        fiveOpen = this.add.sprite(500, 652, 'atlas', 'fiveOpen.png').setOrigin(0, 0).setVisible(false).setDepth(100);
        fiveBatt = this.add.sprite(500, 652, 'atlas', 'fiveBatt.png').setOrigin(0, 0).setVisible(false).setDepth(100);

        fiveMask = this.add.sprite(468, 533, 'atlas', 'fiveMask.png').setName("fiveMask").setOrigin(0, 0);
        recorder.addMaskSprite('fiveMask', fiveMask);
        fiveMask.on('pointerdown', () => {
            roomReturnWall = 3;
            if (fiveInit) {
                fiveInit = false;
                this.scene.launch("Five");
                this.scene.sleep();
            } else {
                this.scene.wake("Five");
                this.scene.sleep();
            }
        });

        twoDoorMask = this.add.sprite(235, 381, 'atlas', 'twoDoorMask.png').setName('twoDoorMask').setOrigin(0, 0);
        recorder.addMaskSprite('twoDoorMask', twoDoorMask);
        twoDoorMask.on('pointerdown', () => {
            let transit = false;
            let selectedThing = slots.getSelected();
            if (twoDoorUnlocked)
                transit = true;
            if (transit) {
                myUI.didGoal('enterSecond');
                roomReturnWall = 0;
                if (twoInit) {
                    twoInit = false;
                    this.scene.launch("RoomTwo");
                    this.scene.sleep();
                } else {
                    this.scene.wake("RoomTwo");
                    this.scene.sleep();
                }
            } else {
                if (selectedThing.thing == "objRedKey") {
                    //console.log("unlock red!");
                    slots.clearItem("objRedKey");
                    slots.clearSelect();
                    twoDoorUnlocked = true;
                    //transit = true;
                    this.sound.play('sfx', { name: 'doorUnlocked', start: 18, duration: 1 });
                    updateWall = true;
                } else {
                    this.sound.play('sfx', { name: 'doorLocked', start: 3, duration: .5 });
                }
            }
        });

        twoDoorUnlockedWall = this.add.image(0, 0, 'wall3doorOpen').setOrigin(0, 0).setDepth(1).setVisible(false);

        doorMask = this.add.sprite(274, 398, 'atlas', 'doorMask.png').setName("doorMask").setOrigin(0, 0);
        recorder.addMaskSprite('doorMask', doorMask);
        doorMask.on('pointerdown', () => {
            let selectedThing = slots.getSelected();
            if (myUI.getDoorUnlocked()) {
                egress = true; // TODO doorUnlocked needs multiple states... then drop this flag
                updateWall = true;
            } else if (selectedThing.thing == "objKeyWhole") {
                myUI.setDoorUnlocked(true);
                updateWall = true;
                //slots.clearItem(this, "objKeyWhole");
                slots.clearItem("objKeyWhole");
                slots.clearSelect(); // TODO why not do this automatically on clearItem()??
                this.sound.play('sfx', { name: 'doorUnlocked', start: 18, duration: 1 });
            } else {
                this.sound.play('sfx', { name: 'doorLocked', start: 3, duration: .5 });

            }
        });

        begButton = this.add.sprite(172, 947, 'atlas2', 'begButton.png').setOrigin(0, 0).setDepth(3);
        begButton.on('pointerdown', () => {
            window.open("fin.html", "_self");
        });
        begButton.setInteractive();
        begButton.setVisible(false);

        // Debugger text
        viewportText = this.add.text(10, 10, '');
        viewportText.setDepth(3001); // TODO: rationalize the crazy depths!

        // Fakey test debug icon
        slots.addIcon(icons[7], "fake", "fake", false, 10); // TODO: get name from sprite?!

        this.events.on('wake', () => {
            //console.log(`Main awakes! return to ${roomReturnWall}`)
            this.scene.bringToTop();
            this.scene.bringToTop("PlayerUI")
            myUI.setActiveScene("PlayGame");

            viewWall = roomReturnWall;
            if (viewWall == 4) {
                myUI.hideSettings();
            }
            updateWall = true;
        });

        this.cameras.main.fadeIn(500);

        // Fancy cursors can wait...
        //this.input.setDefaultCursor('url(assets/input/cursors/blue.cur), auto');
        //this.input.setDefaultCursor(
        // "url(" + require("./assets/input/cursors/blue.cur") + "), auto"); 

    }


    preload() {
        walls[0] = "wall1";
        walls[1] = "wall2";
        walls[2] = "wall3";
        walls[3] = "wall4";
        walls[4] = "table";
        walls[5] = "(item view)";
        walls[6] = "(item view alt)";
        walls[7] = "wallUnlocked";
        walls[8] = "wallWinner";

        icons[0] = "icon - donut.png";
        icons[1] = "icon - plate.png";
        icons[2] = "icon - keyB.png";
        icons[3] = "icon - keyA.png";
        icons[4] = "icon - keyWhole.png";
        icons[5] = "icon - donutPlated.png";
        icons[6] = "icon - roach.png";
        icons[7] = "icon - empty.png";
        icons[8] = "iconBattery.png";
        icons[9] = "DELETED";
        icons[10] = "iconZot.png";

        obj[0] = "objDonut";
        obj[1] = "objPlate";
        obj[2] = "objKeyB";
        obj[3] = "objKeyA";
        obj[4] = "objKeyWhole";
        obj[5] = "objDonutPlated";
        obj[6] = "objRoach";
        obj[7] = "objBattery";
        obj[8] = "DELETED";
        obj[9] = "objZot";


        altObj[0] = "altobjDonut";
        altObj[1] = "altobjPlateKey";
        altObj[2] = "altobjKeyB";
        altObj[3] = "altobjKeyA";
        altObj[4] = "altobjKeyWhole";
        altObj[5] = "altobjDonutPlated";
        altObj[6] = "altobjRoach";
        altObj[7] = "altobjBattery";
        altObj[8] = "DELETED";
        altObj[9] = "altobjZot";

        tableView[0] = "tableDonut.png";
        tableView[1] = "tablePlate.png";
        tableView[2] = "tableKey.png";
        tableView[3] = "tableEmpty.png";

        closeView[0] = "closeDonut.png"
        closeView[1] = "closePlate.png"
        closeView[2] = "closeKey.png"
        closeView[3] = "closeEmpty.png"

        clue2states[0] = "clue2-closed.png";
        clue2states[1] = "clue2-left.png";
        clue2states[2] = "clue2-open.png";
        clue2states[3] = "clue2-right.png";
    }
}
