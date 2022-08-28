import axios from "axios";
import * as cheerio from "cheerio";

export const ScrapeCategoryForUrls = (url) => new Promise((resolve, reject) => {
    axios.get(url).then(res => {
        const html = res.data;
        const $ = cheerio.load(html);
        const itemLinks = [];

        $("a[class=category-page__member-link]").each(function () {
            itemLinks.push($(this).attr("href"));
        });

        resolve(itemLinks);
    }).catch(e => reject(e));
});

Object.defineProperty(String.prototype, "ClearMarkings", {
    value: function ClearMarkings() {
        return this
            .replace("(Skyrim)", "")
            .replace("(Item)", "")
            .replace("(Hearthfire)", "")
            .replace("(Dawnguard)", "")
            .replace("(Quest Item)", "")
            .trim();
    },
    writable: true,
    configurable: true
});