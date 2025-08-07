import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 8080;

// Root route to prevent 404
app.get('/', (req, res) => {
  res.send('API is up. Use /scrape to get data.');
});

app.get('/scrape', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://thepetnest.com/adopt-a-dog', {
      waitUntil: 'networkidle2',
    });

    const pets = await page.evaluate(() => {
      const petElements = document.querySelectorAll('.pet__item');
      const petData = [];

      petElements.forEach((pet) => {
        petData.push({
          petName: pet.querySelector('.pet__name')?.innerText.trim() || 'N/A',
          postedOn:
            pet.querySelector('.date-tag')?.innerText.replace('Posted on:', '').trim() || 'N/A',
          imageUrl: pet.querySelector('.pet__image')?.src || 'N/A',
          gender:
            pet.querySelector('.pet-meta-details span:nth-child(1)')?.innerText.trim() || 'N/A',
          age:
            pet.querySelector('.pet-meta-details span:nth-child(3)')?.innerText.trim() || 'N/A',
          location:
            pet.querySelector('.pet-meta-details:nth-child(3)')?.innerText.trim() || 'N/A',
          ownerName: pet.querySelector('.owner-name b span')?.innerText.trim() || 'N/A',
          adoptionLink: pet.querySelector('a.more-details-btn')?.href || 'N/A',
        });
      });

      return petData;
    });

    await browser.close();
    res.json({ pets });
  } catch (err) {
    console.error('Scraping error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
