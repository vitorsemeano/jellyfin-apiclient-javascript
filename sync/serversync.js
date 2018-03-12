﻿function performSync(connectionManager, server, options) {

    console.log(`ServerSync.performSync to server: ${server.Id}`);

    options = options || {};

    let uploadPhotos = options.uploadPhotos !== false;

    if (options.cameraUploadServers && !options.cameraUploadServers.includes(server.Id)) {
        uploadPhotos = false;
    }

    const promise = uploadPhotos ? uploadContent(connectionManager, server, options) : Promise.resolve();

    return promise.then(() => syncMedia(connectionManager, server, options));
}

function uploadContent(connectionManager, server, options) {

    return import(AppModules.contentUploader).then((ContentUploader) => {

        return new ContentUploader().uploadImages(connectionManager, server);
    });
}

function syncMedia(connectionManager, server, options) {

    return import('./mediasync').then((MediaSync) => {

        return import(AppModules.localAssetManager).then((localAssetManager) => {

            const apiClient = connectionManager.getApiClient(server.Id);

            return new MediaSync().sync(apiClient, localAssetManager, server, options);
        });
    });
}

export default class ServerSync {
    sync(connectionManager, server, options) {

        if (!server.AccessToken && !server.ExchangeToken) {

            console.log(`Skipping sync to server ${server.Id} because there is no saved authentication information.`);
            return Promise.resolve();
        }

        const connectionOptions = {
            updateDateLastAccessed: false,
            enableWebSocket: false,
            reportCapabilities: false,
            enableAutomaticBitrateDetection: false
        };

        return connectionManager.connectToServer(server, connectionOptions).then(result => {

            if (result.State === 'SignedIn') {
                return performSync(connectionManager, server, options);
            } else {
                console.log(`Unable to connect to server id: ${server.Id}`);
                return Promise.reject();
            }

        }, err => {

            console.log(`Unable to connect to server id: ${server.Id}`);
            throw err;
        });
    }
}