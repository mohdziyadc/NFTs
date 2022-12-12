const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

async function storeImages(imagesLocation) {
    const fullImagesPath = path.resolve(imagesLocation); //We are using path npm package for this

    // Filter the files in case the are a file that in not a .png
    const files = fs
        .readdirSync(fullImagesPath)
        .filter((file) => file.includes(".png"));

    let responses = [];

    console.log("Uploading to Pinata...");
    for (fileIdx in files) {
        console.log(`Working on ${files[fileIdx]}`);
        const readableStreamForFile = fs.createReadStream(
            `${fullImagesPath}/${files[fileIdx]}`
        );

        const indexForNaming = readableStreamForFile.path.lastIndexOf("/");

        const options = {
            pinataMetadata: {
                name: readableStreamForFile.path.slice(indexForNaming + 1),
            },
        };
        try {
            await pinata
                .pinFileToIPFS(readableStreamForFile, options)
                .then((result) => {
                    responses.push(result);
                })
                .catch((err) => {
                    console.log(err);
                });
        } catch (e) {
            console.log(e);
        }
    }

    //The responses array will contain the hash of each uploaded file

    return { responses, files };
}

async function storeTokenUriMetadata(metadata) {
    const options = {
        pinataMetadata: {
            name: metadata.name,
        },
    };

    try {
        const response = await pinata.pinJSONToIPFS(metadata, options);
        return response;
    } catch (e) {
        console.log(e);
    }

    return null;
}

module.exports = { storeImages, storeTokenUriMetadata };
