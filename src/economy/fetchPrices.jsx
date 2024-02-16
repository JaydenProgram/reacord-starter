// pricesFetcher.js
async function fetchPrices() {
    try {
      const response = await fetch('https://raw.githubusercontent.com/SkyHelperBot/Prices/main/prices.json');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('There was a problem fetching the prices:', error);
      return null;
    }
  }
  
  module.exports = { fetchPrices };