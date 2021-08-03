const {
    app,
    BrowserWindow,
    ipcMain,
    Notification,
    Tray,
    Menu,
    screen
} = require("electron");
const path = require("path");
require('electron-reload')(__dirname);
let tray = null;
let mainWin = null;
let notifyWin = null;

const obtenerBloqueo = app.requestSingleInstanceLock()

if (!obtenerBloqueo) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Si alguien intentó ejecutar un segunda instancia, debemos
        //enfocarnos en nuestra ventana principal.
        if (mainWin) {
            if (mainWin.isMinimized()) mainWin.restore()
            if (!mainWin.isVisible()) mainWin.show();
            mainWin.focus()
        }
    })


}
app.on("ready", () => {
    mainWin = new BrowserWindow({
        title: "CHAT COOPEFACSA",
        icon: path.join(__dirname, "chaticon.ico"),
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),

        },

    });
    notifyWin = new BrowserWindow({
        title: "CHATX",
        width: 300,
        height: 150,
        x: 1600,
        icon: path.join(__dirname, "chaticon.ico"),
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        },
        alwaysOnTop: true,
        minimizable: false,
        maximizable: false,
        modal: true,
        frame:false,
        show:false,
    })
    notifyWin.on("close",()=>{
        mainWin.show();
    })
    notifyWin.setMenu(null)
    notifyWin.setPosition(screen.getPrimaryDisplay().workAreaSize.width - 305, screen.getPrimaryDisplay().workAreaSize.height - 155)
    const ejs = require("ejs");
    const option = {
        root: __dirname
    }
    const data = {
        lista: []
    }
    ejs.renderFile("pages/newMessage.ejs", data, option, function(err, str){
        err ? console.log(err) : notifyWin.loadURL('data:text/html;charset=utf-8,' + encodeURI(str));console.log(str)
    })

    ipcMain.on("minimizar", () => {
        console.log("se mandó a la bandeja de notificaciones")
        mainWin.hide();
        showTray();
    })
    ipcMain.on("mensaje", (e, args) => {

        console.log("se ha recibido unmensaje")
        notifyWin.show();
        if (args.body.length == 0 && args.msg.files.length > 0) {
            args.body = "[Archivos adjuntos]"
        }
        args.icon = path.join(__dirname, 'chaticon.ico')
        let notify = new Notification(args)
        notify.on("click", () => {
            e.reply("openChat", args)
            if (!mainWin.isVisible()) {
                mainWin.show();
            }

        })
        notify.show();
        if (tray) {
            tray.displayBalloon({
                title: "hola",
                content: "Soy un globito"
            })
        }
    })
    ipcMain.on("openChat", () => {
        if (!mainWin.isVisible()) {
            mainWin.show();
        }

    })

    mainWin.loadURL("http://chatx.coopefacsa.coop:3001")
    mainWin.on("show", () => {
        tray.destroy();
    })
    mainWin.on("hide", () => {
        showTray()
    })

});

function showTray() {
    if (tray) {
        tray.destroy()
    }
    tray = new Tray(path.join(__dirname, "chaticon.ico"));
    tray.setToolTip("Chat COOPEFACSA")
    const contextM = Menu.buildFromTemplate([{
            label: "Mostrar chat",
            type: "normal",
            click: () => {
                mainWin.restore()
            }
        },
        {
            label: "Cerrar el programa",
            type: "normal",
            click: () => {
                app.quit();
            }
        }
    ])
    tray.setContextMenu(contextM);
    tray.on("double-click", () => {
        mainWin.show();
    })


}