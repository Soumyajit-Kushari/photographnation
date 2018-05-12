var oldres = "";
var hasNewres = false;

var app = {
    isAuthenticated: false,
    isloading: false,
    isOffline: false,
    spinner: document.querySelector('.loader'),
    main: document.getElementById('main'),
    loginform: document.getElementById('login-form'),
    dialogActive: false,
    dialog: document.querySelector('.dialog-container'),
    infoContainer: document.querySelector('.info-container')
};


var UI = {
    navbuttons: document.getElementById("nav-buttons"),
    logoutbtn: document.getElementById("logout-btn"),
    uploadbtn: document.getElementById("upload-btn"),
    uploadCancel: document.getElementById('uploadcancel'),
    guid_input: document.getElementById("hidden_guid_input"),
    err: document.getElementById("err-text")
};


app.spinnertoggle = function () {
    var hidden = !(app.isloading);
    if (hidden)
        app.spinner.style.display = "inline-block";
    else
        app.spinner.style.display = "none";

    app.isloading = !app.isloading;
    console.log("spinner Active :" + app.isloading);
}

app.logout = function () {
    localStorage.removeItem("guid");
    location.replace("/");
}

app.checkAuthentication = function () {
    app.isAuthenticated = (localStorage.getItem("guid") != null);
}

app.networkCheck = function () {
    app.isOffline = (!navigator.onLine);
}

app.updateCards = function (data) {
    var db = JSON.parse(data);
    var url = "http://www.geocities.ws/photographnation/";

    app.main.innerHTML = ""; //clearning old cards;

    db.forEach(img => {

        var card = document.createElement("div");
        card.id = img.guid;
        card.classList.add('card');

        var element = document.createElement("img");
        element.src = url + img.guid + '.' + img.type;
        card.appendChild(element);

        app.main.appendChild(card);
    });
}

function dialogToggle() {
    if (app.dialogActive)
        app.dialog.classList.remove('dialog-container--visible');
    else
        app.dialog.classList.add('dialog-container--visible');

    app.dialogActive = !app.dialogActive;
}

function loaddata() {
    var xhttp = new XMLHttpRequest();
    var guid = localStorage.getItem("guid");

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            app.spinnertoggle();

            if (this.status == 200) {
                app.updateCards(this.responseText);
            }
            else {
                app.main.innerHTML = "<div class='card'>Could not load Data !</div>";
            }
        }

    };

    xhttp.open("GET", "./img?guid=" + guid, true);
    xhttp.send();
}

function checkforData() {
    var xhttp = new XMLHttpRequest();
    var guid = localStorage.getItem("guid");

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {

            if (this.status == 200) {
                if (oldres != this.response) {
                    hasNewres = true;
                }
                else
                    hasNewres = false;

                oldres = this.response;
            }
            else {
                hasNewres = true;
            }
        }
    };

    xhttp.open("GET", "./img?guid=" + guid, true);
    xhttp.send();
}

// Login if requested

var q = location.search.replace("?", '');
var req = q.split(':');


/// request handler

if (req[0] != "" /*ie no command has been sent*/) {

    if (req[0] == 'login') { // checking login request
        if (req[1] != 'NaN') {
            localStorage.setItem("guid", req[1]);
            location.replace("/");
        }
        else{
            UI.err.innerHTML ="Incoorect Username or passwords";
        }

        
    }
}


//Starting the app

app.networkCheck();
app.checkAuthentication();

if (app.isAuthenticated) {
    app.spinnertoggle();

    UI.logoutbtn.addEventListener("click", function () {
        app.logout();
    });

    UI.uploadbtn.addEventListener("click", function () {
        dialogToggle();
    });

    UI.uploadCancel.addEventListener("click", function () {
        dialogToggle();
    });

    UI.guid_input.setAttribute("value", localStorage.getItem("guid"))

    if (!app.isOffline) {
        //check for new data

        setInterval(function () {
            console.log("checking for new data " + hasNewres);
            if (hasNewres) {
                app.infoContainer.innerHTML = ""; // clearning info container
                loaddata();
            }

            checkforData();
        }, 1000);
    }

    app.loginform.style.display = "none";
    UI.navbuttons.style.display = "inline-block";
}
else {
    console.log("app is not authenticated");
    UI.navbuttons.style.display = "none";
}

if (app.isOffline) {
    UI.navbuttons.style.display = "none";
    app.main.innerHTML = "<div class='card'>You are Offline :(</div>";
    app.spinnertoggle();
}