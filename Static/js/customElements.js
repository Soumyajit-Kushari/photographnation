customElements.define('img-card', class extends HTMLElement {

    constructor(imgData) {
        super();

        var src = "https://res.cloudinary.com/daxfhtkqw/image/fetch/q_80,fl_progressive,w_300/";
        var imgUrl = "http://www.geocities.ws/photographnation/";

        imgUrl += imgData.guid + '.' + imgData.type;
        src += imgUrl;

        this.guid = imgData.uploader;
        this.src = src;
        this.url = imgUrl;
        this.imgID = imgData.guid;

        const shadowRoot = this.attachShadow({ mode: 'open' });

        shadowRoot.innerHTML = `
        <link rel="stylesheet" type="text/css" href="css/inline.css">
        <div class="card">
            <img alt="picture" id="content" src="https://dummyimage.com/200" />
            <br>
            <div class="container">
                <a href="${imgUrl}" class="mdl-button mdl-button--fab" target="_blank" rel="noopener" style="margin: 5px;">
                    <i class="material-icons">launch</i>
                </a>
                <a id="share" class="mdl-button mdl-button--fab" style="margin: 5px;">
                    <i class="material-icons">share </i>
                </a>
                <a id="comment" class="mdl-button mdl-button--fab" style="margin: 5px;">
                <i class="material-icons">comment</i>
            </a>
                <a id="like" class="mdl-button mdl-button--fab" style="margin: 5px;">
                    <i class="material-icons">thumb_up_alt</i>
                </a>
                <span>
                    <span>${imgData.thumbs_up}</span>
                </span>
                <div class="profile">
                    <img src="https://dummyimage.com/50" >
                </div>
            </div>
        </div>
        `;
    }

    connectedCallback() {

        function check_thumbs(image_id) {

            var data = { "type": "img", "guid": image_id, "user": localStorage.getItem("guid") };

            return fetch("/check-thumbs", {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'content-type': 'application/json'
                }
            }).then(function (res) {
                return res.text();
            }).then(function (text) {
                return text;
            });
        }

        function updateCard() {
            var request = new Request("/get_profile?guid=" + elm.guid);

            fetch(request).then(function (response) {
                return response.json();
            }).then(function (data) {

                fetch(data.image_url)
                    .then(function (response) {
                        return response.blob();
                    }).then(function (blob) {
                        var objectURL = URL.createObjectURL(blob);

                        var profile = elm.shadowRoot.querySelector(".profile img");
                        profile.src = objectURL;
                        profile.title = data.name;
                        profile.alt = data.name;
                    })

                check_thumbs(elm.imgID).then((result) => {
                    if (result == "true") {
                        elm.shadowRoot.querySelector("#like").style.backgroundColor = "#00A4FF";
                    }
                });
            });

            fetch(elm.src).then(function (response) {
                return response.blob();
            }).then(function (blob) {
                var objectURL = URL.createObjectURL(blob);

                var content = elm.shadowRoot.querySelector("#content");
                content.src = objectURL;
            })
        }

        function share(url) {
            navigator.share({
                title: 'Photographnation',
                text: 'Check out Photographnation image',
                url: (url),
            })
                .then(() => console.log('Successful share'))
                .catch((error) => console.log('Error sharing', error));
        }

        // updating the element

        var elm = this;

        updateCard();

        this.shadowRoot.querySelector("#share").addEventListener('click', function () {
            share(elm.url);
        });

        this.shadowRoot.querySelector("#like").addEventListener("click", function () {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/thumbs-up');
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

            xhr.onload = function () {
                console.log("image liked");
            };

            var req = 'guid=' + elm.imgID + '&user=' + localStorage.getItem("guid") + '&type=img';
            xhr.send(req);
        });

        this.shadowRoot.querySelector("#comment").addEventListener("click", function () {
            document.querySelector('#comment-dialog iframe').src = "view.html?id=" + elm.imgID;
            
            var dialogbox = document.querySelector('.dialog-container');

            dialogbox.classList.add('dialog-container--visible');
            app.dialogActive = true;

            document.querySelector('#comment-dialog').style.display = "inline-block";

        
        })
    }
});