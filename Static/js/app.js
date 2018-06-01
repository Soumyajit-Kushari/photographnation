var oldres = "";
var hasNewres = false;
var max_pages = 1;
var current_page = 1;
var global_tag = "null";

const fetch_count = 9;


var app = {
    isAuthenticated: false,
    userName: null,
    profile_img: null,
    user_email: null,
    isloading: false,
    isOffline: false,
    selectedUser: null,
    spinner: document.querySelector('.loader'),
    main: document.getElementById('main'),
    img_data: document.getElementById("img-data"),
    loginform: document.getElementById('login-form'),
    dialogActive: false,
    dialog: document.querySelector('.dialog-container'),
    infoContainer: document.querySelector('.info-container')
};

var UI = {
    appDrawer: document.querySelector(".app-drawer"),
    navbuttons: document.getElementById("nav-buttons"),
    uploadbtn: document.getElementById("upload-btn"),
    uploadCancel: document.getElementById('uploadcancel'),
    guid_input: document.getElementById("hidden_guid_input"),
    err: document.getElementById("err-text"),
    load_next_btn: document.getElementById("load-next"),
    load_pre_btn: document.getElementById('load-pre'),
    uploaddialog: document.getElementById('upload-dialog'),
    searchdialog: document.getElementById('search-dialog'),
    commentdialog: document.getElementById('comment-dialog'),
    searchbtn: document.getElementById('search'),
    searchcancelbtn: document.getElementById('search-cancel'),
    load_next_container: document.getElementById("load-next-container"),
    searchClear: document.getElementById('search-clear'),
    install_button: document.getElementById('install'),
    menuButton: document.getElementById("menu-button"),
};

var Dialogs = [UI.searchdialog, UI.uploaddialog, UI.commentdialog];

app.checkAuthentication = function () {
    app.isAuthenticated = (localStorage.getItem("guid") != null);
}

app.networkCheck = function () {
    app.isOffline = (!navigator.onLine);
}

app.updateCards = function (data) {
    var db = JSON.parse(data);

    app.img_data.innerHTML = ""; //clearning old cards;

    db.forEach(img => {
        if (img != null) {

            const ImageCard = customElements.get('img-card');
            var imgCard = new ImageCard(img);

            app.img_data.appendChild(imgCard);
        }
    });
}

function dialogToggle() {
    Dialogs.forEach((dialog) => {
        dialog.style.display = "none";
    })

    if (app.dialogActive)
        app.dialog.classList.remove('dialog-container--visible');
    else
        app.dialog.classList.add('dialog-container--visible');

    app.dialogActive = !app.dialogActive;
}

function loaddata(page, tag = global_tag) {
    var xhttp = new XMLHttpRequest();

    update_max_page_count();

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200) {
                if (this.responseText != "[]") {
                    app.updateCards(this.responseText);
                }
                else {
                    app.img_data.innerHTML = "<div class='card'>No Uploads yet ! Be the first one to upload an image";
                }
            }
            else {
                app.img_data.innerHTML = "<div class='card'>Could not load Data !</div>";
            }
        }

    };
    var req = "";

    if (max_pages > 1) {
        req = "./img?guid=" + app.selectedUser
            + "&page=" + page
            + "&fetch_count=" + fetch_count
            + "&tag=" + tag;
    }
    else {
        req = "./img?guid=" + app.selectedUser
            + "&page=" + page
            + "&tag=" + tag;
    }

    xhttp.open("GET", req, true);
    xhttp.send();
}

function checkforData(tag = global_tag) {
    var xhttp = new XMLHttpRequest();

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
    xhttp.open("GET", "/img?guid=" + app.selectedUser + "&tag=" + tag, true);
    xhttp.send();
}

function update_max_page_count(tag = global_tag) {
    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var db = JSON.parse(this.response);
            max_pages = Math.ceil(db.length / fetch_count);
        }
    };

    xhttp.open("GET", "/img?guid=" + app.selectedUser + "&tag=" + tag, true);
    xhttp.send();
}

function updateTagInfo() {
    var tagUI = document.querySelector("#tag").innerHTML = global_tag;
}

function changeGlobalTag(tag = "null") {
    global_tag = tag;
    updateTagInfo();

    UI.searchClear.style.display = "none";
    UI.searchbtn.style.display = "inline";
}

function loadSearchResults() {
    var input = document.getElementById("search-text").value.toLowerCase();

    if (input == "")
        return;

    changeGlobalTag(input);
    app.selectedUser = null;

    dialogToggle();

    if (app.dialogActive) {
        UI.searchdialog.style.display = "inline-block";
    }
    else {
        UI.searchdialog.style.display = "none";
    }

    UI.searchbtn.style.display = "none";
    UI.searchClear.style.display = "inline";
}

function setUserDetails() {
    if (app.userName == null)
        return;

    var profile_img = document.getElementById('profile');
    profile_img.setAttribute("src", app.profile_img);

    var user_name = document.getElementById('user-name');
    user_name.innerHTML = app.userName;
}

function onSignIn(googleUser) {

    var profile = googleUser.getBasicProfile();

    app.userName = profile.getName();
    app.user_email = profile.getEmail();
    app.profile_img = profile.getImageUrl();

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/google-login');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onload = function () {
        localStorage.setItem("guid", xhr.responseText);
        console.log('Signed in as: ' + xhr.responseText);
        app.isAuthenticated = true;
    };


    xhr.send('name=' + profile.getName() + '&image_url=' + profile.getImageUrl() + '&email=' + profile.getEmail());
}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        console.log('User signed out.');
        localStorage.removeItem("guid");
        location.reload(true);
    });
}


//Starting the app
//initial conditions

app.checkAuthentication();
app.networkCheck();

UI.load_next_container.style.display = "none";

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    UI.install_button.style.display = 'inline';
});

window.addEventListener('appinstalled', (evt) => {
    UI.install_button.style.display = 'none';
});


UI.install_button.addEventListener('click', (e) => {
    UI.install_button.style.display = 'none';

    deferredPrompt.prompt();
    deferredPrompt.userChoice
        .then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        });
});

function setUIListener() {
    UI.uploadbtn.addEventListener("click", function () {
        dialogToggle();

        if(!app.dialogActive) dialogToggle();

        if (app.dialogActive) {
            UI.uploaddialog.style.display = "inline-block";
        }
        else {
            UI.uploaddialog.style.display = "none";
        }
    });

    UI.uploadCancel.addEventListener("click", function () {
        dialogToggle();

        if (app.dialogActive) {
            UI.uploaddialog.style.display = "inline-block";
        }
        else {
            UI.uploaddialog.style.display = "none";
        }
    });

    UI.load_next_btn.addEventListener("click", function () {
        if (current_page < max_pages)
            current_page++;

        loaddata(current_page);
    });

    UI.load_pre_btn.addEventListener("click", function () {
        if (current_page > 1)
            current_page--;

        loaddata(current_page);
    })

    UI.searchbtn.addEventListener("click", function () {
        dialogToggle();
        if(!app.dialogActive) dialogToggle();
        if (app.dialogActive) {
            UI.searchdialog.style.display = "inline-block";
        }
        else {
            UI.searchdialog.style.display = "none";
        }
    });

    document.querySelector("#comment-close").addEventListener("click", function () {
        dialogToggle();

        if (app.dialogActive) {
            document.querySelector('#comment-dialog').style.display = "inline-block";
        }
        else {
            document.querySelector('#comment-dialog').style.display = "none";
        }
    });

    UI.searchcancelbtn.addEventListener("click", function () {
        dialogToggle();

        if (app.dialogActive) {
            UI.searchdialog.style.display = "inline-block";
        }
        else {
            UI.searchdialog.style.display = "none";
        }
    });

    UI.menuButton.addEventListener("click", function () {
        UI.appDrawer.classList.add('active');
    })

    var appDrawerClosebtn = document.getElementById('app-drawer-close');

    appDrawerClosebtn.addEventListener("click", function () {
        UI.appDrawer.classList.remove('active');
    });
}


if (app.isAuthenticated) {
    UI.guid_input.setAttribute("value", localStorage.getItem("guid"));
    app.loginform.style.display = "none";
    document.body.style.background = "linear-gradient( #777 45%, #444)";
    UI.appDrawer.style.display = "inline-block";
    UI.menuButton.style.display = "inline";
    setUserDetails();
}

//Updating App
applicationInitRun = true;

setInterval(function () {
    app.checkAuthentication();
    app.networkCheck();


    if (app.isAuthenticated && !app.isOffline) {
        setUserDetails();


        if (app.img_data.innerHTML == "") {
            app.spinner.style.display = "inline-block";
            app.isloading = true;
        }
        else {
            app.spinner.style.display = "none";
            app.isloading = false;
        }

        UI.appDrawer.style.display = "inline-block";
        UI.menuButton.style.display = "inline";

        update_max_page_count();
        app.loginform.style.display = "none";
        UI.navbuttons.style.display = "inline-block";
        UI.uploadbtn.style.display = "inline-block";

        if (max_pages == 1 || max_pages == 0 || current_page == max_pages) {
            UI.load_next_btn.style.display = "none";
        } else {
            UI.load_next_btn.style.display = "inline-block";
        }

        if (current_page > 1) {
            UI.load_pre_btn.style.display = "inline-block";
        } else {
            UI.load_pre_btn.style.display = "none";
        }


        if (applicationInitRun) {
            document.body.style.background = "linear-gradient(#777 45%, #444)";
            UI.guid_input.setAttribute("value", localStorage.getItem("guid"));
            setUIListener();
            applicationInitRun = false;
        }

        //check for new data
        if (hasNewres) {
            UI.load_next_container.style.display = "inline-block";
            loaddata(1);
        }
        checkforData();
    }
    else {
        oldres = "";
        UI.menuButton.style.display = "none";
        UI.appDrawer.style.display = "none";
        app.loginform.style.display = "inline-block";
        UI.navbuttons.style.display = "none";
        UI.uploadbtn.style.display = "none";
        document.body.style.background = "url('https://res.cloudinary.com/daxfhtkqw/image/upload/c_scale,q_65/v1526622456/bg.jpg')  cover center  no-repeat";
    }

    if (app.isOffline) {
        oldres = "";
        UI.appDrawer.style.display = "none";
        UI.menuButton.style.display = "none";
        UI.navbuttons.style.display = "none";
        UI.uploadbtn.style.display = "none";
        UI.load_next_container.style.display = "none";
        app.img_data.innerHTML = "<div class='card'>You are Offline :(</div>";
    }
}, 1500);
