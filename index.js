const PORT = process.env.PORT || 8000;
const SOURCEURL = "https://elderscrolls.fandom.com";
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.get("/", (req, res) => {
   res.json("Skyrim API");
});

app.get("/items", (req, res) => {
    axios.get(`${SOURCEURL}/wiki/Category:Skyrim:_Items`).then(async response => {
        const html = response.data;
        const $ = cheerio.load(html);
        const items = [];
        const itemsOnPage = [];

        $("a[class=category-page__member-link]").each(function () {
           itemsOnPage.push(SOURCEURL + $(this).attr("href"));
        });

        await Promise.all(itemsOnPage.map(async (item) => {
            console.log(`Loading item: ${item}`);
            switch (item) {
                case "Items":
                case "Apparel":
                    return;
            }
            const itemHtml = (await axios.get(item)).data;
            const $ = cheerio.load(itemHtml);
            const previewHtml = $("img[class=pi-image-thumbnail]").first();

            const itemName = $("h1[class=page-header__title]").text()
                .replace("(Skyrim)", "")
                .replace("(Item)", "")
                .trim();
            const weight = $("td[data-source=weight]").text().trim();
            const value = $("td[data-source=value]").text().trim();

            let previewSrc = (previewHtml.attr("src") ?? "").split(".png")?.[0];
            if(previewSrc)
                previewSrc = previewSrc + ".png";

            const itemData = {
                name: itemName,
                url: item,
                preview: previewSrc,
                weight: weight,
                value: value,
            }
            if(itemData.weight !== "")
                items.push(itemData);
            console.log(`Loaded ${itemData.name}`);
        }));
        items.sort((a, b) => a.name.localeCompare(b.name));
        res.json(items);
    }).catch(err => {
        console.error(err);
    });
});

app.listen(PORT, () => console.log(`Skyrim API listening on port :${PORT}`))