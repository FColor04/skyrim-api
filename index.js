import chalk from 'chalk';
import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const PORT = process.env.PORT || 8000;
const SOURCEURL = "https://elderscrolls.fandom.com";
const app = express();

app.get("/", (req, res) => {
   res.json("Skyrim API");
});

//Cache items
const items = [];
axios.get(`${SOURCEURL}/wiki/Category:Skyrim:_Items`).then(async response => {
    const html = response.data;
    const $ = cheerio.load(html);
    const itemsOnPage = [];

    $("a[class=category-page__member-link]").each(function () {
        itemsOnPage.push(SOURCEURL + $(this).attr("href"));
    });
    let i = 0;

    await Promise.all(itemsOnPage.map(async (item) => {
        let itemHtml;
        try {
            const myIndex = i + 1;
            i++;
            console.log(chalk.yellow(`(${myIndex} / ${itemsOnPage.length}) Loading item: ${item}`));
            itemHtml = (await axios.get(item)).data;

            console.log(chalk.green(`(${myIndex} / ${itemsOnPage.length}) Loading item: ${item} Done!`));
        } catch (e) {
            console.error(chalk.bold.red(e));
            return;
        }
        const $ = cheerio.load(itemHtml);
        const previewHtml = $("img[class=pi-image-thumbnail]").first();

        const itemName = $("h1[class=page-header__title]").text()
            .replace("(Skyrim)", "")
            .replace("(Item)", "")
            .trim();
        const weight = $("td[data-source=weight]").text().trim();
        const value = $("td[data-source=value]").text().trim();
        const description = $("div[class=mw-parser-output] > p").text().trim();
        const itemId = $('aside > div[class="pi-item pi-data pi-item-spacing pi-border-color"] > div > span').text();

        let previewSrc = (previewHtml.attr("src") ?? "").split(".png")?.[0];
        if(previewSrc)
            previewSrc = previewSrc + ".png";

        const itemData = {
            name: itemName,
            url: item,
            description: description,
            preview: previewSrc,
            weight: weight,
            value: value,
            id: itemId,
        }
        if(itemData.weight !== "")
            items.push(itemData);
    }));

    items.sort((a, b) => a.name.localeCompare(b.name));

    console.log(chalk.green("Items loading done!"))

    app.get("/items", (req, res) => {
        res.json(items);
    });
}).catch(err => {
    console.error(err);
});

app.listen(PORT, () => console.log(`Skyrim API listening on port :${PORT}`))