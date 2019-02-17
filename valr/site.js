//////////////////////////////
//  Configure connect object
/////////////////////////////

const Connect = window.uportconnect
const uport = new Connect('VALR SSI Quest', {
    network: "mainnet",
    profileImage: {
        "/": "/ipfs/QmZWK7HRRM4Q5zC8aeRd1u9B3XtyTxRLQW211tAxaphMia"
    },
    bannerImage: {
        "/": "/ipfs/QmdwUeghExKjyfYNz43yWHeF7ndjxSeaZosUQQ6ogbEr8T"
    },
    description: "VALR Stand @ Blockchain Africa 2019 Conference"
})

/**
 * @description Login and register the delegate as attending the booth.
 * @author G de Beer
 * @date 2019-02-17
 */
function register() {
    const btnTable = document.querySelector('#tbl');
    const msgDiv = document.querySelector('#msg');

    //Ask the user for their address information
    //by using default disclosure behavior.
    uport.requestDisclosure({
        requested: ['name', 'email', 'country', 'phone', 'ticket'],
        verified: ['SAFBC', 'VALR', 'ticket'],
        notifications: true
    })
    uport.onResponse('disclosureReq')
        .then(res => {
            const did = res.payload.did;
            json = JSON.stringify(res.payload);
            verified = res.payload.verified;
            console.log(res.payload);

            btnTable.parentNode.removeChild(btnTable);

            msgDiv.innerHTML =
                `<p>Welcome ${res.payload.name}, you are now <b>logged in</b>.</p>`;

            count = 0;

            if (verified.length === 0) {
                console.log('SAFBC cred not issued yet');
                msgDiv.innerHTML = msgDiv.innerHTML +
                    `<p>I see you are eager to play the SSI Quest, but you must first please visit the SAFBC stand to start!</p>`;

                msgDiv.innerHTML = msgDiv.innerHTML + '<br/>' +
                    `<button class="btn" onclick="logout('${res.payload.name}')">Logout</button>`;

            } else {
                verified.forEach(element => {
                    console.log(++count);
                    if (undefined === element.claim.SAFBC) {
                        console.log('SAFBC cred not issued yet');
                        msgDiv.innerHTML = msgDiv.innerHTML +
                            `<p>I see you are eager to play the SSI Quest, but you must first please visit the SAFBC stand to start!</p>`;

                        msgDiv.innerHTML = msgDiv.innerHTML + '<br/>' +
                            `<button class="btn" onclick="logout('${res.payload.name}')">Logout</button>`;
                    } else {
                        if (undefined === element.claim.VALR) {
                            console.log('VALR cred not issued yet');
                            msgDiv.innerHTML = msgDiv.innerHTML +
                                `<p>Thank you for visiting the VALR stand ${res.payload.name}.<br/>You have been issued an attendance credential. Please continue your quest for all the other credentials.</p>`;

                            let claimData = {
                                'VALR': {
                                    'DelegateName': res.payload.name,
                                    'DelegateEmail': res.payload.email,
                                    'AttendedVALR': true,
                                    'LastSeen': `${new Date()}`
                                }
                            }

                            // log the visit to firestore
                            logDelegate(claimData);

                            uport.sendVerification({
                                exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
                                claim: claimData

                            }).then(() => {
                                msgDiv.innerHTML = msgDiv.innerHTML + '<br/>' +
                                    `<button class="btn" onclick="logout('${res.payload.name}')">Logout</button>`;
                            })
                        } else {
                            console.log('VALR cred already issued');
                            msgDiv.innerHTML = msgDiv.innerHTML +
                                `<p>Thank you for visiting the VALR stand ${res.payload.name}.<br/>You have already been issued an attendance credential. Please continue your quest for all the other credentials.</p>`;
                            msgDiv.innerHTML = msgDiv.innerHTML + '<br/>' +
                                `<button class="btn" onclick="logout('${res.payload.name}')">Logout</button>`;
                        }
                    }

                });
            }

        })
}

/**
 * @description Log the user out and clear session data.
 * @author G de Beer
 * @date 2019-02-17
 * @param {*} name Name for friendly screen message
 */
function logout(name) {

    uport.logout();
    uport.reset();

    document.querySelector('#msg').innerHTML =
        `<p>Goodbye ${name}. You are logged out. </p>`;

    setTimeout(location.reload(), 2000);

}

/**
 * @description Log the delegate activity to firestore via cloud function.
 * @author G de Beer
 * @date 2019-02-17
 * @param {*} visitor uPort claim data
 */
function logDelegate(visitor) {
    var xhr = new XMLHttpRequest();
    var data = JSON.stringify(visitor);
    xhr.onreadystatechange = function () {
        if (this.readyState == 4) {
            console.log('XHR request completed. ', this.responseText);
        }
    };
    xhr.open("POST", "https://us-central1-veritydemo1.cloudfunctions.net/function-1");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);
}