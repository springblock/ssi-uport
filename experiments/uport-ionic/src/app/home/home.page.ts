import { Component } from '@angular/core';
import { LoadingController } from '@ionic/angular';

declare var uportconnect: any;
declare var faker: any;

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {
    loading: HTMLIonLoadingElement;

    constructor(
        public loadingController: LoadingController
    ) { }

    msg = '';
    loggedin = false;
    learning = false;
    Connect = uportconnect;
    uport = new this.Connect('Old Mutual SSI Quest', {
        network: 'mainnet',
        profileImage: { '/': '/ipfs/QmbWR7ZV7QhSnjmfGKoiT5wmvqLjSBFT1msFvMKgCdYWK5' },
        bannerImage: { '/': '/ipfs/Qmbcxvpf7A4wshhZtoPVyXioED7c33sDrJdMjFNqAx6gFp' },
        description: 'Old Mutual & 22seven @ Blockchain Africa 2019 Conference'
    });
    count: number;

    checkIn() {
        this.uport.requestDisclosure({
            requested: ['name'],
            verified: ['SAFBC', 'OldMutual', 'BAC_ID'],
            notifications: true
        })
            .catch((e) => {
                this.loading.dismiss();
                console.log(e);
            });

        this.presentLoading();

        this.uport.onResponse('disclosureReq')
            .then(res => {
                this.loading.dismiss();
                const did = res.payload.did;
                const json = JSON.stringify(res.payload);
                const verified = res.payload.verified;
                console.log(res.payload);

                this.loggedin = true;
                this.msg = `Welcome Delegate, you are now logged in`;

                this.count = 0;

                if (verified.length === 0) {
                    console.log('SAFBC cred not issued yet');
                    // document.querySelector('#msg').innerHTML =
                    // document.querySelector('#msg').innerHTML +
                    this.msg = this.msg +
                        '<br>I see you are eager to play the SSI Quest, but you must first please visit the SAFBC stand to start!';

                } else {
                    verified.forEach(element => {
                        console.log(++this.count);
                        if (undefined === element.claim.NationalID) {
                            console.log('ID cred not issued yet');
                            this.msg = this.msg +
                                `I see you are eager to play the SSI Quest,
                                 but you must first please visit the SAFBC stand to get your own #BAC-ID!`;

                        } else {
                            if (undefined === element.claim.OldMutual) {
                                console.log('OldMutual cred not issued yet');
                                this.msg = this.msg +
                                    `<p>Thank you for visiting the Old Mutual stand.</p>
                                <p>You have been issued an attendance credential.<br/>
                                Please continue your quest for all the other credentials.</p>`;

                                const claimData = {
                                    'OldMutual': {
                                        'DelegateDID': res.payload.did,
                                        'AttendedOldMutual': true,
                                        'LastSeen': `${new Date()}`
                                    }
                                };

                                const claimKYC = {
                                    'OldMutualKYC': {
                                        'IDNumber': res.payload.BAC_ID.IDNumber,
                                        'NomDeGuerre': res.payload.BAC_ID.NomDeGuerre,
                                        'Domicile': res.payload.BAC_ID.Domicile,
                                        'Issued': `${new Date()}`
                                    }
                                };

                                const a = Object.keys(claimData)[0];

                                // log the visit to firestore
                                const logData = {
                                    'user': res.payload,
                                    'OldMutual': claimData.OldMutual,
                                    'OldMutualKYC': claimKYC.OldMutualKYC
                                };

                                this.logDelegate(logData);

                                this.uport.sendVerification({
                                    exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
                                    claim: claimData
                                }).then(() => {
                                    this.uport.sendVerification({
                                        exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
                                        claim: claimKYC
                                    });
                                });

                                this.learning = true;

                            } else {
                                console.log('OldMutual cred already issued');
                                this.msg = this.msg +
                                    `<p>Thank you for coming back to the Old Mutual stand.</p>
                                <p>You have already been issued an attendance credential.<br>
                                Please continue your quest for all the other credentials.</p>`;
                            }
                        }

                    });
                }

            })
            .catch((e) => {
                this.loading.dismiss();
                console.log(e);
            });
    }

    logout() {

        this.uport.logout();
        this.uport.reset();

        this.loggedin = false;
        this.learning = false;
        this.msg = null;

        location.reload();

    }

    async presentLoading() {
        this.loading = await this.loadingController.create({
            spinner: 'circles',
            message: 'Please wait...',
            translucent: true,
        });
        return await this.loading.present();
    }

    /**
    * @description Log the delegate activity to firestore via cloud function.
    * @author G de Beer
    * @date 2019-02-17
    * @param visitor uPort claim data
    */
    logDelegate(visitor) {
        const xhr = new XMLHttpRequest();
        const data = JSON.stringify(visitor);
        xhr.onreadystatechange = function () {
            if (this.readyState === 4) {
                console.log('XHR request completed. ', this.responseText);
            }
        };
        // tslint:disable-next-line:quotemark
        xhr.open("POST", "https://us-central1-veritydemo1.cloudfunctions.net/function-1");

        // tslint:disable-next-line:quotemark
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(data);
    }

}
