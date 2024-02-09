const fs = require('fs');
const path = require('path');




// Function to fetch SkyBlock items data from the API
export async function fetchSkyBlockItems() {
    try {
        // Dynamically import 'node-fetch'
        const fetch = (await import('node-fetch')).default;

        const response = await fetch('https://api.hypixel.net/v2/resources/skyblock/items');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data.items;
    } catch (error) {
        console.error('Error fetching SkyBlock items:', error.message);
        return null;
    }
}



export async function fetchImages() {
    // Define the folder path
    const folderPath = './v3'; // Adjusted folder path
    
    return new Promise((resolve, reject) => {
      const jsonData = {};
      const filesToRead = ['emojis.json', 'images.json', 'itemHash.json'];
      let filesRead = 0;
  
      filesToRead.forEach(file => {
        fs.readFile(path.join(folderPath, file), 'utf8', (err, data) => {
          if (err) {
            reject('Error reading file');
            return;
          }
          jsonData[file] = JSON.parse(data);
          filesRead++;
  
          // Check if all files have been read
          if (filesRead === filesToRead.length) {
            resolve(jsonData);
          }
        });
      });
    });
  }