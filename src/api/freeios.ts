const URLS = [
  "https://www.newmobilelife.com/category/apps-%E6%83%85%E5%A0%B1/%E9%99%90%E6%99%82%E5%85%8D%E8%B2%BB%E6%83%85%E5%A0%B1/",
  "https://mrmad.com.tw/category/3c-information/free-app/",
]

// 去重基準來自 `actions:freeios:text` 的既有內容：每行一個標題。
// 修改 update_text 格式時，務必同步調整 getSeenTitles 的解析。
const getSeenTitles = (lastText: string): Set<string> => {
  return new Set(lastText.split("\n").map(line => line.trim()).filter(Boolean));
};

export default async (text: string) => {
  const taiwanDate = new Date().toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" });
  const get1 = fetch(URLS[0]).then(response => response.text()).then(html => {
    const titleRegex = /<h2 class="cs-entry__title"><a href="[^"]+">([^<]+)<\/a><\/h2>/g;
    const dateRegex = /<div class="cs-meta-date">([^<]+)<\/div>/g;

    const titles = [...html.matchAll(titleRegex)].map(match => match[1]);
    const dates = [...html.matchAll(dateRegex)].map(match => match[1]);

    const apps = titles.map((title, index) => {
      return { title, date: dates[index] };
    });

    return apps;
  });

  const get2 = fetch(URLS[1]).then(response => response.text()).then(html => {
    const titleRegex = /<a href="[^"]+" rel="bookmark">([^<]+)<\/a>/g;
    const dateRegex = /<\/span>(.*?)作者:/g;

    const titles = [...html.matchAll(titleRegex)].map(match => match[1]);
    const dates = [...html.matchAll(dateRegex)].map(match => match[1]);

    const apps = titles.map((title, index) => {
      return { title, date: dates[index] };
    });

    return apps;
  });

  const [apps1, apps2] = await Promise.all([get1, get2]);
  const apps = [...apps1, ...apps2].sort((b, a) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestApps = apps.filter(app => new Date(app.date) >= new Date(taiwanDate));

  const seenTitles = getSeenTitles(text);
  const newApps = latestApps.filter(app => !seenTitles.has(app.title));
  if (newApps.length === 0) return { update_text: text, needs_update: false };

  // update_text 存當天完整清單（供 GET 顯示與下次去重），
  // notification_text 只含本次真正新增的標題。
  const update_text = latestApps.map(app => app.title).join("\n");
  const notification_text = newApps.map(app => app.title).join("\n\n");
  return { update_text, needs_update: true, notification_text };
};
