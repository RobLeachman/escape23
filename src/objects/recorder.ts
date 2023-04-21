// Nothing to compress...
//import { stringify } from 'zipson';

import { setCookie, getCookie } from "../utils/cookie";

import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getBytes, StorageReference } from "firebase/storage";

//import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
//import { getStorage, ref, uploadString } from "firebase/storage";
// "Just to add more options to the puzzle: you can use a serverless realtime database (serverless, gun.js, channable/icepeak, brynbellomy/redwood, rethinkdb, sapphire-db, emitter.io,kuzzle.io, feathersjs, deepstream.io, firebase, supabase.io, etc.)""

const minDelayFastMode = 10;
const debuggingDumpRecordingOut = false;
const debugDisplayFastSteps = false;
const debugDisplayRecordedActions = false;
const debugDisplayRecordedSteps = false; // display each recorded mask click

let stealthRecord = true; // don't show pointer while recording
let usingRecordingCookies = false; // relies on setter
let recordedRNGSeed: string;
let recordedPlayername: string;

let storageFolder = "v1Test/";

let musicPlayTime = 0;

export default class Recorder {
    pointer: Phaser.Input.Pointer;
    pointerSprite: Phaser.GameObjects.Sprite;
    clickSprite: Phaser.GameObjects.Sprite;
    prevClickX: number;
    prevClickY: number;
    oldPointerDown: boolean;
    oldPointerTime: number;
    oldPointerX: number; oldPointerY: number;
    recordPointerX: number; recordPointerY: number;
    spriteMap = new Map<string, Phaser.GameObjects.Sprite>();

    clickers: Phaser.GameObjects.Sprite[] = [];

    recording: string;
    recordingSize: number;
    recorderMode: string;
    totalClicks: number;
    storageRef: StorageReference;
    playerName: string;
    timeStamp: string;
    myUUID: string;

    cameraHack: number;
    RNGSeed: string;

    timeStart: number;
    elapsedMinutes: number;
    spoilerCount = 0;

    constructor(pointerSprite: Phaser.GameObjects.Sprite,
        clickSprite: Phaser.GameObjects.Sprite,
        cameraHack: number,
        RNGSeed: string
    ) {
        this.pointerSprite = pointerSprite;
        this.clickSprite = clickSprite;
        this.cameraHack = cameraHack;
        this.oldPointerX = 0; this.oldPointerY = 0;
        this.recording = "";
        this.totalClicks = 0;
        this.RNGSeed = RNGSeed;

        /************
         // TODO: Add SDKs for Firebase products that you want to use
                // https://firebase.google.com/docs/web/setup#available-libraries
        
                // Your web app's Firebase configuration
                const firebaseConfig = {
                    apiKey: "AIzaSyCXKLmBPEdmc-7J0M9BWuFN2e9RqGMUf-0",
                    authDomain: "escape23-9c153.firebaseapp.com",
                    projectId: "escape23-9c153",
                    storageBucket: "escape23-9c153.appspot.com",
                    messagingSenderId: "575545476353",
                    appId: "1:575545476353:web:20671a688f62d9bb388700",
                    measurementId: "G-G9X9NTNH1M"
                };
        
                // Initialize Firebase
                // @ts-ignore not sure what I'll do with app
                const app = initializeApp(firebaseConfig);
                //const analytics = getAnalytics(app);
        
                // FIREBASE database action...                
                        const db = getFirestore(app);
                        // Get a list of cities from your database
                
                        async function getCities(db) {
                            const citiesCol = collection(db, 'cities');
                            const citySnapshot = await getDocs(citiesCol);
                            const cityList = citySnapshot.docs.map(doc => doc.data());
                            return cityList;
                        }
                
        
                
                        // https://firebase.google.com/docs/storage/web/start -- quickstart steps, after shit works
                        Prepare to launch your app:
                           Enable App Check to help ensure that only your apps can access your storage buckets.
                
                           Set up budget alerts for your project in the Google Cloud Console.
                
                           Monitor the Usage and billing dashboard in the Firebase console to get an overall picture of your project's usage across multiple Firebase services. You can also visit the Cloud Storage Usage dashboard for more detailed usage information.
                
                           Review the Firebase launch checklist.
                
        
        
        
        
                // WORKS!
                const myUUID = Date.now().toString();
                console.log("UUID " + myUUID)
        
                // Initialize Cloud Storage and get a reference to the service
                // Get a reference to the storage service, which is used to create references in your storage bucket
                const storage = getStorage();
        
                // Create a storage reference from our storage service
        
                // https://firebase.google.com/docs/storage/web/create-reference        
                //   You can create a reference to a location lower in the tree, say 'images/space.jpg' 
                //   by passing in this path as a second argument when calling ref(). 
                
                
                const storageRef = ref(storage, 'v1/' + myUUID + ".txt");
        
        
                let message = 'DATA GOES HERE';
                uploadString(storageRef, message).then((snapshot) => {
                    console.log(snapshot)
                    console.log('Uploaded a raw string!');
                });
                
        
                //update
                        message = "OH WAIT IT CHANGED"
                        
                        uploadString(storageRef, message).then((snapshot) => {
                            console.log(snapshot)
                            console.log('Uploaded new string!');
                        });
                
                // https://firebase.google.com/docs/storage/web/upload-files#monitor_upload_progress
        
                
                "Start in test mode"
                Your data is open by default to enable quick setup. However, 
                you must update your security rules within 30 days to enable long-term client read/write access. 
        
                https://firebase.google.com/docs/storage/security/rules-conditions#public
        
                https://firebase.google.com/docs/firestore/security/get-started?authuser=0&hl=en
        */

        const firebaseConfig = {
            apiKey: "AIzaSyCXKLmBPEdmc-7J0M9BWuFN2e9RqGMUf-0",
            authDomain: "escape23-9c153.firebaseapp.com",
            projectId: "escape23-9c153",
            storageBucket: "escape23-9c153.appspot.com",
            messagingSenderId: "575545476353",
            appId: "1:575545476353:web:20671a688f62d9bb388700",
            measurementId: "G-G9X9NTNH1M"
        };

        // Initialize Firebase
        initializeApp(firebaseConfig);

        this.timeStamp = new Date().toISOString();
        //console.log("Recording play at " + this.timeStamp)

        this.playerName = "INIT"
        const myUUID = this.playerName + "_" + this.timeStamp;

        // Initialize Cloud Storage and get a reference to the service
        // Get a reference to the storage service, which is used to create references in your storage bucket
        const storage = getStorage();

        this.storageRef = ref(storage, storageFolder + myUUID + ".txt");
    }

    getRecordingKey() {
        return this.myUUID;
    }
    getRecordedPlayerName() {
        return recordedPlayername;
    }

    async incrementPlayerCount() {
        const storage = getStorage();
        const countStorageRef = ref(storage, "playerCount.txt");

        // INIT COUNT
        /*
        const playerCount=1000;
        // @ts-ignore no snapshot for uploadString, or at least don't know how to use it        
        uploadString(countStorageRef, playerCount.toString()).then((snapshot) => {
            console.log('Initial count ' + playerCount);
        });
        */

        let fetchError = false;
        let count;
        try {
            count = await getBytes(countStorageRef);
        } catch (err) {
            console.log(err);
            fetchError = true;
        }
        let nextCount = -1;
        if (count) {
            const str = new TextDecoder().decode(count);
            nextCount = parseInt(str, 10) + 1;
        } else {
            console.log("NO COUNT")
            fetchError = true;
        }
        if (fetchError) {
            return 1000;
        } else {
            // @ts-ignore no snapshot for uploadString, or at least don't know how to use it
            uploadString(countStorageRef, nextCount.toString()).then((snapshot) => {
                //console.log('Incremented count ' + nextCount);
            });
            //console.log("PLAYER COUNT=" + nextCount)
            return nextCount;
        }
    }

    setRecordingFilename(fileName: string) {
        //console.log("MODE: " + mode);
        setCookie("escapeRecordingFilename", fileName, 7); // bake for a week
    };

    getRecordingFilename() {
        return getCookie("escapeRecordingFilename");
    }

    async fetchRecording(filename: string) {
        //console.log("Loading file=" + filename);
        const storage = getStorage();
        const bucket = ref(storage, storageFolder + filename);

        let data;
        try {
            data = await getBytes(bucket);
        } catch (err) {
            console.log(err);
            this.setRecordingFilename("");
            return "fail";
        }
        const str = new TextDecoder().decode(data);
        //console.log("Fetched " + str)
        this.recordingSize = str.length * 10000;
        return str;
    }

    // This only works if we don't reload to start recording while changing name... ?
    setPlayerName(name: string) {
        if (name == "qqq" || name == "norandom" || name == "Quazar") {
            storageFolder = "v1Test/";
        }

        this.playerName = name;
        const storage = getStorage();
        this.myUUID = this.playerName + "_" + this.timeStamp;
        //console.log("Recorder UUID " + myUUID)
        this.storageRef = ref(storage, storageFolder + this.myUUID + '.txt');
        if (this.playerName == "qqq")
            stealthRecord = false;
    }

    getPlayerName() {
        return this.playerName;
    }

    addMaskSprite(key: string, sprite: Phaser.GameObjects.Sprite) {
        //console.log(`registered mask ${key} ${sprite}`)
        const testDupe = this.spriteMap.get(key);
        if (testDupe != undefined) {
            throw ("ERROR duplicate mask sprite! " + key)
        }
        this.spriteMap.set(key, sprite);
    }
    getMaskSprite(key: string) {
        return this.spriteMap.get(key);
    }

    setMode(mode: string) {
        //console.log("MODE: " + mode);
        this.recorderMode = mode;
        setCookie("escapeRecorderMode", mode, 7); // bake for a week
    };

    getMode() {
        let mode = getCookie("escapeRecorderMode");
        if (mode == undefined || mode.length == 0) {
            mode = "init";
        }
        this.recorderMode = mode;
        return mode;
    }

    setReplaySpeed(mode: string) {
        setCookie("escapeRecorderSpeed", mode, 7); // bake for a week
    };

    getReplaySpeed() {
        return getCookie("escapeRecorderSpeed");
    };

    setFourPuzzleSolvedOnce(puzzle: string) {
        setCookie("solvedFour-" + puzzle, "solved", 30); // bake for a month
    }

    getFourPuzzleSolvedOnce(puzzle: string) {
        return getCookie("solvedFour-" + puzzle);
    }

    setSoundMuted(isMuted: boolean) {
        if (isMuted)
            setCookie("soundMuted", "muted", 365); // bake for a year
        else
            setCookie("soundMuted", "notmuted", 365); // bake for a year
    }
    getSoundMuted() {
        return getCookie("soundMuted");
    }
    setMusicMuted(isMuted: boolean) {
        if (isMuted)
            setCookie("musicMuted", "muted", 365); // bake for a year
        else
            setCookie("musicMuted", "notmuted", 365); // bake for a year
    }
    getMusicMuted() {
        return getCookie("musicMuted");
    }



    getSize() {
        let size = -1;
        if (this.recordingSize)
            size = this.recordingSize
        return size;
    }

    setCookieRecorderMode(doCookies: boolean) {
        usingRecordingCookies = doCookies;
    }
    getCookieRecorderMode() {
        return usingRecordingCookies;
    }

    // called once per update, tracks pointer movement and clicks on the scene
    checkPointer(scene: Phaser.Scene) {
        let pointerClicked: Boolean = false;
        const sceneName = scene.sys.settings.key;
        this.pointer = scene.input.activePointer; // we don't know what it is until update fires and they click so set every time, is fine

        this.fadeClick();

        if (this.oldPointerDown != this.pointer.isDown) {
            this.oldPointerDown = this.pointer.isDown;
            if (this.oldPointerDown) {
                pointerClicked = true;
            }
        }
        // RIGHT CLICK CHECK
        //if (pointerClicked && this.pointer.rightButtonDown()) {
        //    this.getRecording();
        //    return;
        //}

        let pointerTime = scene.time.now - this.oldPointerTime;
        if (this.oldPointerX != this.pointer.x || this.oldPointerY != this.pointer.y || pointerTime > 1000 || pointerClicked) {

            let distanceX = Math.abs(this.pointer.x - this.oldPointerX);
            let distanceY = Math.abs(this.pointer.y - this.oldPointerY);
            // 500 resolution is sufficient?
            if ((distanceX + distanceY > 100) || (pointerTime > 1200) || pointerClicked) {
                this.oldPointerX = this.pointer.x;
                this.oldPointerY = this.pointer.y;
                if (!stealthRecord) {

                    this.pointerSprite.setX(this.pointer.x);
                    this.pointerSprite.setY(this.pointer.y - this.cameraHack);
                }
                this.oldPointerTime = scene.time.now;

                if (this.recordPointerX != this.oldPointerX || this.recordPointerY != this.oldPointerY) {
                    this.recordPointerX = this.oldPointerX;
                    this.recordPointerY = this.oldPointerY;
                    this.recordPointerAction("mousemove", scene.time.now, sceneName);
                }
            }
        }

        if (pointerClicked) {
            //console.log("recorder.checkPointer.click!")
            this.recordPointerAction("mouseclick", scene.time.now, sceneName);
            if (!stealthRecord)
                this.showClick(scene, this.pointer.x, this.pointer.y);
            pointerClicked = false;
            this.totalClicks++;
            this.dumpRecording();

            // calculate elapsed time on every click
            let secs = Math.floor((Date.now() - this.timeStart) / 1000);
            //secs = secs * 30; //accelerate when testing
            let spoilerPenalty = 0;
            if (this.spoilerCount > 0) {
                spoilerPenalty += (this.spoilerCount - 1) * 30;
                secs += spoilerPenalty;
            }
            this.elapsedMinutes = Math.floor(secs / 60);
        }
    }

    getElapsedMinutes() {
        return this.elapsedMinutes;
    }

    setTimeStart(timeStart: number) {
        this.timeStart = timeStart;
    }

    getWinTimeWords() {
        const seconds = Math.floor((Date.now() - this.timeStart) / 1000);
        return this.getFormattedTime(seconds);
    }

    setStoppedMusicTime(hadStarted: boolean) {
        if (!hadStarted)
            musicPlayTime = -1;
        else
            musicPlayTime = Math.floor((Date.now() - this.timeStart) / 1000);
    }

    getMusicPlayTime() {
        if (musicPlayTime == 0)
            return "never"
        else if (musicPlayTime < 0)
            return "muted"
        else
            return "music off after " + this.getFormattedTime(musicPlayTime)
    }

    getFormattedTime(secs: number) {
        const minutes = Math.floor(secs / 60);
        const seconds = secs - minutes * 60;
        const winTime = minutes + ':' + seconds.toString().padStart(2, '0');
        return winTime;
    }

    timePenalty() {
        this.spoilerCount++;
    }

    getSpoilerCount() {
        return this.spoilerCount;
    }

    recordPointerAction(action: string, time: number, sceneName: string) {
        if (action != "mousemove") {
            //console.log(`RECORDER ACTION ${action} ${Math.floor(this.pointer.x)}, ${Math.floor(this.pointer.y)} @ ${time}`)
        }
        this.recording = this.recording.concat(`${action},${Math.floor(this.pointer.x)},${Math.floor(this.pointer.y)},${time},%${sceneName}%:`);
        //console.log("recording so far:");
        //console.log(this.recording)
    }
    recordObjectDown(object: string, scene: Phaser.Scene) {
        if (debugDisplayRecordedActions)
            console.log(`>>>>>>>>RECORDER OBJECT ${object} SCENE ${scene.sys.settings.key}`);
        if (object == "")
            console.log("ERROR no recorder object specified!")
        this.pointer = scene.input.activePointer;

        if (object == "__MISSING") {
            throw new Error("MISSING OBJECT MASK")
        }
        this.recording = this.recording.concat(`object=${object},${Math.floor(this.pointer.x)},${Math.floor(this.pointer.y)},${scene.time.now},%${scene.sys.settings.key}%:`);
    }
    // icons always belong to the main game scene so no need to save it
    recordIconClick(object: string, time: number, scene: Phaser.Scene) {
        this.pointer = scene.input.activePointer;
        //console.log(`RECORDER ICON CLICK ${object} @ ${time}`);
        this.recording = this.recording.concat(`icon=${object},${Math.floor(this.pointer.x)},${Math.floor(this.pointer.y)},${time},:`);
    }

    async getRecording() {
        recordedPlayername = this.getRecordingFilename().split('_')[0];
        //console.log("load from cloud: " + this.getRecordingFilename() + " player " + recordedPlayername);
        let recordingIn = await this.fetchRecording(this.getRecordingFilename());
        //console.log("CLOUD RECORDING IN");
        //console.log(recordingIn);
        return this.parseRecording(recordingIn);
    }

    getRecordingFromCookies() {
        let recordingIn = "not loaded";
        let cookieNumber = -1;
        let eof = "";
        recordingIn = "";
        while (eof == "") {
            cookieNumber++;
            let cookie = getCookie("test" + cookieNumber);
            recordingIn += cookie.split('|')[0];;
            eof = cookie.split('|')[1];
        }
        if (recordingIn.length > 0)
            return this.parseRecording(recordingIn);
        else
            return "no cookies"
    }

    parseRecording(recordingIn: string) {
        const recordingChecksum = recordingIn.split('?')[0];
        // @ts-ignore
        // with luck will need version checking later
        const recordingVersion = recordingIn.split('?')[2];
        recordedRNGSeed = recordingVersion.split('-')[0];
        //console.log("parse version: " + recordingVersion.split('-')[1]);

        const recordingDataCompressed = recordingIn.split('?')[1];
        let recIn = recordingDataCompressed
        let re = /mousemove,/g; recIn = recIn.replace(re, "#");
        re = /#/g; recIn = recIn.replace(re, "mousemove,");
        re = /!/g; recIn = recIn.replace(re, "mouseclick,");
        re = /=/g; recIn = recIn.replace(re, "object=");
        re = /\-/g; recIn = recIn.replace(re, "icon=");
        re = /\%A\%/g; recIn = recIn.replace(re, "\%PlayGame\%");
        re = /\%B\%/g; recIn = recIn.replace(re, "\%ZotTable\%");
        re = /\%C\%/g; recIn = recIn.replace(re, "\%BootGame\%");
        re = /\%D\%/g; recIn = recIn.replace(re, "\%RoomTwo\%");
        re = /\%E\%/g; recIn = recIn.replace(re, "\%Clue2\%");
        re = /\%F\%/g; recIn = recIn.replace(re, "\%TwoWay\%");
        re = /\%G\%/g; recIn = recIn.replace(re, "\%Four\%");
        re = /\%H\%/g; recIn = recIn.replace(re, "\%Five\%");
        re = /\%I\%/g; recIn = recIn.replace(re, "\%PlayerUI\%");
        re = /\%J\%/g; recIn = recIn.replace(re, "\%HintBot\%");
        re = /\%K\%/g; recIn = recIn.replace(re, "\%Settings\%");

        if (recordingChecksum == this.checksum(recIn)) {
            //console.log("-->Good recording " + recIn);
            if (debugDisplayRecordedSteps) {
                const debugRecording = recIn.split(':');
                debugRecording.forEach((action) => {
                    if (action.split(',')[0] != "mousemove" && action.split(',')[0] != "mouseclick")
                        console.log(`DBGREC ${action}`)
                });
            }

        } else {
            console.log("ERROR: RECORDING CKSUM, CAN'T THROW ERROR SINCE NO WAY TO CLEAR")
            //throw new Error('recording cksum error');
        }
        return recIn;
    }

    getRNGSeed() {
        return recordedRNGSeed;
    }

    makeFast(recordingSlow: string, speedSteps: number) {
        let stepCount = 0;
        let fast = "";
        const actionString = recordingSlow.split(":");
        if (debugDisplayFastSteps)
            console.log("Recorder action count=" + actionString.length)
        let fastSteps = actionString.length;
        if (speedSteps > 0) {
            console.log(`will skip ${speedSteps} before going back to perfect play`);
            fastSteps = speedSteps;
        }
        actionString.forEach((action) => {
            let thisAction = action.split(',');
            let delay = thisAction[3];
            if (fastSteps > 0)
                delay = minDelayFastMode.toString();
            else
                delay = "200";
            fast = fast.concat(`${thisAction[0]},${thisAction[1]},${thisAction[2]},${delay},${thisAction[4]}:`);
            if (debugDisplayFastSteps) {
                //if (thisAction[0] != "mousemove" && thisAction[0] != "mouseclick") {
                if (true) {
                    if (fastSteps > 0)
                        console.log(`MAKEFAST*(${stepCount++}) ${thisAction[0]},${thisAction[1]},${thisAction[2]},${delay},${thisAction[4]}:`)
                    else
                        console.log(`MAKEFAST(${stepCount++})  ${thisAction[0]},${thisAction[1]},${thisAction[2]},${delay},${thisAction[4]}:`)
                }
            }
            fastSteps--;
        });
        return fast;
    }

    dumpRecording() {
        const rec = this.recording.split(":");

        //rec.forEach((action) => {
        //    console.log(`DUMPREC ${action}`)
        //});

        let recOut = "";
        //console.log("ACTION COUNT " + rec.length);
        // struggling with TS arrays https://dpericich.medium.com/how-to-build-multi-type-multidimensional-arrays-in-typescript-a9550c9a688e
        let actions: [string, number, number, number, string][] = [["BOJ", 0, 0, 0, "scn"]];

        //console.log(rec);
        // @ts-ignore
        // TODO how to use index without action? easy stuff probably, just now trying to build
        rec.forEach((action, idx) => {
            let thisActionRec = rec[idx];
            //console.log("raw recording " + thisActionRec);
            let nextActionRec = rec[idx + 1] ?? "";   //Typescript check undefined and fix it up
            const secondLookahead = rec[idx + 2] ?? "";

            if (nextActionRec.length == 0) {
                nextActionRec = "OOF,0,0,0"
            }
            if (thisActionRec.length == 0) {
                thisActionRec = "EOF,0,0,0"
            }
            //console.log(`\nthis ${thisActionRec} next ${nextActionRec}`)
            const thisAction = thisActionRec.split(',')[0];
            let nextActionTime = nextActionRec.split(",")[3];
            if (nextActionTime === undefined)
                nextActionTime = secondLookahead.split(",")[3];

            // fix up clicks recorded with no time
            //console.log(`action ${thisAction}`)
            const complexAction = thisAction.split('=');
            if (complexAction.length > 1) {
                //console.log(`action complex!!! ${complexAction[0]} ${nextActionTime}`)
                thisActionRec = `${thisActionRec},${nextActionTime}`
                //console.log(`  ${thisActionRec}`)
            } else {
                //console.log(`  ${thisActionRec}`)
            }
            if (thisActionRec.includes("object=icon") || thisActionRec.includes("EOF,")) { // we need the icon click not the mask click
                //console.log("SKIP:")
            } else {
                //console.log(`  ${thisActionRec}`)
                //recOut += thisActionRec + ":";
                const splitAction = thisActionRec.split(',');

                actions.push([splitAction[0], parseInt(splitAction[1], 10), parseInt(splitAction[2], 10), parseInt(splitAction[3], 10), splitAction[4]]);
            }
        });

        // BROKEN BY PLAYERUI 
        // Must throw out redundant stuff. Find these and mark time as 0.
        // Perhaps could clean up the input recorded actions but let's just fix them here
        // It's a big mess that calls for a do-over on all of this but for now it is what it is
        /*
        actions.forEach((action, idx) => {
            //console.log("RECORDER ACT " + action);
            if (idx < actions.length - 1) {
                const nextAction = actions[idx + 1];
                //console.log(action[3] + " " + nextAction[3])
                const complexAction = action[0].split('='); // icon or object mask
                if (complexAction.length > 1) {
                    if (action[3] == nextAction[3]) {
                        nextAction[3] = 0;
                        if (idx < actions.length - 2)
                            actions[idx + 2][3] = 0;
                    }
                } else if (action[3] == nextAction[3]) {
                    //console.log("move then click, skip the move");
                    action[3] = 0;
                }
            }
        });
        */

        // calculate elapsed time for non-redundant events and we're done, build the output string
        let prevTime = 0;
        let elapsed = 0;
        actions.forEach((action) => {
            //console.log(`ActionIn ${action}  time ${action[3]} scene ${action[4]}`);
            /*
            if (action[4] == "PlayGame") {
                action[4] = "A"
            } else if (action[4] == "ZotTable") {
                action[4] = "B"
            } else if (action[4] == "BootGame") {    
                action[4] = "C"
            }
            */
            if (action[3] > 0) {
                elapsed = action[3] - prevTime;
                //console.log("elapsed=" + elapsed)
                prevTime = action[3];
                if (debuggingDumpRecordingOut && action[0] != "mousemove" && action[0] != "mouseclick")
                    console.log(`>> ${action}  time ${action[3]}  elapsed ${elapsed}  scene ${action[4]}`);
                recOut = recOut.concat(`${action[0]},${action[1]},${action[2]},${elapsed},${action[4]}:`);
            }
        });

        const recording = recOut;

        const recordedClicks = (recording.match(/mouseclick/g) || []).length;
        if (recordedClicks != this.totalClicks) {
            console.log(`********* recording click ERROR, recorded=${recordedClicks} actual=${this.totalClicks}`)
            console.log(`error recording`)
            console.log(recording)
            //throw new Error(`recording click error, recorded=${recordedClicks} actual=${this.totalClicks}`);
        }

        //console.log(`Save recording (clicks=${this.totalClicks}):\n ${recOut}`);
        let re = /mousemove,/g; recOut = recording.replace(re, "#");
        re = /mouseclick,/g; recOut = recOut.replace(re, "!");
        re = /object=/g; recOut = recOut.replace(re, "=");
        re = /icon=/g; recOut = recOut.replace(re, "\-"); // NEEDS TO BE $ SINCE - COULD BE USED IN A NAME BY ACCIDENT
        re = /\%PlayGame\%/g; recOut = recOut.replace(re, "\%A\%");
        re = /\%ZotTable\%/g; recOut = recOut.replace(re, "\%B\%");
        re = /\%BootGame\%/g; recOut = recOut.replace(re, "\%C\%");
        re = /\%RoomTwo\%/g; recOut = recOut.replace(re, "\%D\%");
        re = /\%Clue2\%/g; recOut = recOut.replace(re, "\%E\%");
        re = /\%TwoWay\%/g; recOut = recOut.replace(re, "\%F\%");
        re = /\%Four\%/g; recOut = recOut.replace(re, "\%G\%");
        re = /\%Five\%/g; recOut = recOut.replace(re, "\%H\%");
        re = /\%PlayerUI\%/g; recOut = recOut.replace(re, "\%I\%");
        re = /\%HintBot\%/g; recOut = recOut.replace(re, "\%J\%");
        re = /\%Settings\%/g; recOut = recOut.replace(re, "\%K\%");

        recOut = this.checksum(recording) + "?" + recOut + "?" + this.RNGSeed + "-v1";
        //console.log("RECORDING OUT " + recOut);
        if (usingRecordingCookies) {
            this.saveCookies(recOut);
        }

        // Firestore
        // @ts-ignore no snapshot for uploadString, or at least don't know how to use it...
        uploadString(this.storageRef, recOut).then((snapshot) => {
            console.log('Uploaded recording!');
        });
    }

    // local debugging
    saveCookies(data: string) {
        //console.log("COOKIES OUT " + data);

        this.recordingSize = data.length;
        const cookieName = "test";
        // must split if too big
        let chunked = this.chunkString(data, 4080); // max 4096
        // @ts-ignore FIX THIS TOO
        chunked!.forEach((chunk, idx) => {
            chunked![idx] += "|"
        });
        chunked![chunked!.length - 1] += "EOF"; // https://timmousk.com/blog/typescript-object-is-possibly-null/
        //console.log(chunked);
        chunked!.forEach((chunk, idx) => {
            let cookieNameOut = cookieName + idx;
            //console.log("COOKIEOUT " + cookieNameOut + ":" + chunk);
            setCookie(cookieNameOut, chunk, 7); // bake for a week
        });


    }

    chunkString(str: string, length: number) {
        return str.match(new RegExp('.{1,' + length + '}', 'g'));
    }

    // https://stackoverflow.com/questions/811195/fast-open-source-checksum-for-small-strings
    checksum(s: string) {
        var chk = 0x12345678;
        var len = s.length;
        for (var i = 0; i < len; i++) {
            chk += (s.charCodeAt(i) * (i + 1));
        }

        return (chk & 0xffffffff).toString(16);
    }

    // When the recorder has a click to show this creates a sprite on the scene
    showClick(scene: Phaser.Scene, x: number, y: number) {

        const recordedClickSprite = scene.add.sprite(1000, 0, 'atlas', 'pointerClicked.png');
        var recordedClickSpriteScale = 2;

        recordedClickSprite.setX(x); recordedClickSprite.setY(y - this.cameraHack);
        recordedClickSprite.setDepth(999);

        if (x == this.prevClickX && y == this.prevClickY) {
            recordedClickSpriteScale = 5;
        }
        if (y > 1000)
            recordedClickSpriteScale = recordedClickSpriteScale * 3;
        recordedClickSprite.setScale(recordedClickSpriteScale)

        this.clickers.push(recordedClickSprite);
        //console.log("CLICKERCOUNT " + this.clickers.length)
        this.prevClickX = x; this.prevClickY = y;

    }

    fadeClick() {
        this.clickers.forEach((clicked, idx) => {
            if (clicked.alpha > 0) {
                clicked.setScale(clicked.scale * .8);
                clicked.setAlpha(clicked.alpha - .01);
            } else {
                this.clickers.splice(idx, 1);
            }
        });
    }
}