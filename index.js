
const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, CommandLine } = require("electron");
const path = require("path");
require('electron-reload')(__dirname);
let tray = null;
let mainWin = null;

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
        title: "Chat COOPEFACSA",
        icon: path.join(__dirname, "chaticon.ico"),
        width: 800, height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),

        },

    })
    //require("vue-devtools").install();
    ipcMain.on("minimizar", () => {
        console.log("se mandó a minimizar")
        mainWin.hide();
        showTray();
    })
    ipcMain.on("mensaje", (e, args) => {

        console.log("se ha recibido unmensaje")
        if (args.body.length == 0 && args.msg.files.length > 0) { args.body = "[Archivos adjuntos]" }
        args.icon = path.join(__dirname, 'chaticon.ico')
        let notify = new Notification(args)
        notify.on("click", () => {
            e.reply("openChat", args)
            if (!mainWin.isVisible()) {
                mainWin.show();
            }

        })
        notify.show();
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
    mainWin.on("hide", () => { showTray() })

});
function showTray() {
    if (tray) { tray.destroy() }
    tray = new Tray(path.join(__dirname, "chaticon.ico"));
    tray.setToolTip("Chat COOPEFACSA")
    const contextM = Menu.buildFromTemplate([
        { label: "Mostrar chat", type: "normal", click: () => { mainWin.restore() } },
        { label: "Cerrar el programa", type: "normal", click: () => { app.quit(); } }
    ])
    tray.setContextMenu(contextM);
    tray.on("double-click", () => {
        mainWin.show();
    })


}