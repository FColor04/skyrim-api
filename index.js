import chalk from 'chalk';
import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import {ScrapeCategoryForUrls} from "./utilities.js";
import * as path from "path";

const PORT = process.env.PORT || 8000;
const SOURCEURL = "https://elderscrolls.fandom.com";

const app = express();
app.listen(PORT, () => console.log(`Skyrim API listening on port :${PORT}`));

app.get("/", (req, res) => {
   res.sendFile(path.join(process.cwd(), '/index.html'));
});

await ScrapeCategoryForUrls("https://elderscrolls.fandom.com/wiki/Category:Skyrim:_Items").then(async res => {
    const itemsCache = [];
    await Promise.all(res.map(async (itemUrl, i) => {
        //Load each item's site for further scraping of name, description etc.
        itemUrl = SOURCEURL + itemUrl;

        console.log(chalk.yellow(`(${i} / ${res.length}) Loading item: ${itemUrl}`));
        const itemHtml = (await axios.get(itemUrl)).data;
        console.log(chalk.green(`(${i} / ${res.length}) Loading item: ${itemUrl} Done!`));

        const $ = cheerio.load(itemHtml);
        const previewSrc = $("img[class=pi-image-thumbnail]").first().attr("src");

        const itemData = {
            name: $("h1[class=page-header__title]").text().ClearMarkings(),
            url: itemUrl,
            description: $("div[class=mw-parser-output] > p").text().trim(),
            preview: previewSrc?.split(".png")?.[0]?.concat(".png"),
            weight: parseFloat($("td[data-source=weight]").text().trim()),
            value: parseFloat($("td[data-source=value]").text().trim()),
            id: $('aside > div[class="pi-item pi-data pi-item-spacing pi-border-color"] > div > span').text(),
        }
        if(itemData.weight !== 0)
            itemsCache.push(itemData);
    }));
    itemsCache.sort((a, b) => a.name.localeCompare(b.name));
    console.log(chalk.green("Items loading done!"))
    app.get("/items", (req, res) => {
        res.json(itemsCache);
    });
});
await ScrapeCategoryForUrls("https://elderscrolls.fandom.com/wiki/Category:Skyrim:_Books").then(async res => {
    const bookCache = [];
    await Promise.all(res.map(async (bookUrl, i) => {
        bookUrl = SOURCEURL + bookUrl;

        console.log(chalk.yellow(`(${i} / ${res.length}) Loading book: ${bookUrl}`));
        const bookHtml = (await axios.get(bookUrl)).data;
        console.log(chalk.green(`(${i} / ${res.length}) Loading book: ${bookUrl} Done!`));

        const $ = cheerio.load(bookHtml);
        const previewSrc = $("img[class=pi-image-thumbnail]").first().attr("src");

        const bookData = {
            name: $("h1[class=page-header__title]").text().ClearMarkings(),
            url: bookHtml,
            description: $("div[class=mw-parser-output] > p").text().trim(),
            preview: previewSrc?.split(".png")?.[0]?.concat(".png"),
            weight: parseFloat($("td[data-source=weight]").text().trim()),
            value: parseFloat($("td[data-source=value]").text().trim()),
            id: $('aside > div[class="pi-item pi-data pi-item-spacing pi-border-color"] > div > span').text(),
        }
        if(bookData.weight !== 0)
            bookCache.push(bookData);
    }));
    bookCache.sort((a, b) => a.name.localeCompare(b.name));
    console.log(chalk.green("Books loading done!"))
    app.get("/items", (req, res) => {
        res.json(bookCache);
    });
});