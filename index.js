const puppeteer = require('puppeteer');
const devices = require("puppeteer/DeviceDescriptors");
const R = require('ramda')
const { query } = require("./query");

const mapM = (f, ps) => {
  const go = (f, ps, res) => {
    return ps.length == 0 
    ? Promise.resolve(res)
    : f(R.head(ps))
        .then(r => go(f, R.tail(ps), res.concat([r])))
  }
  return go(f, ps, [])
}

async function main(params) {

  const jewel_connection_string = process.env["jewel_connection_string"];
  const nexus5x = devices["Nexus 5X"];
  
  const query_result = await query(
    jewel_connection_string,
    `
    select country_code, handle_name, substring(landing_page_url, 0, charindex('?', landing_page_url)) as landing_page, sum(sale) as sales 
    from user_sessions 
    where timestamp > '2018-04-09Z'
    group by country_code, handle_name, landing_page
    having sum(sale) > 0
    order by country_code, handle_name, landing_page
    `
  );

  const browser = await puppeteer.launch();

  try {

    const page = await browser.newPage();

    await page.emulate(nexus5x)

    const go = ({ landing_page, country_code, handle_name, sales }) =>
      page
        .goto(`${landing_page}?offer=1`, {
          waitUntil: "networkidle0",
          timeout: 10 * 1000
        })
        .then(() =>
          page.screenshot({
            path: `screenshots/${country_code}--${handle_name}--${sales}.png`
          })
        );


    const result = await mapM(x => {
      console.log(`Taking screenshot of ${x.landing_page}`)
      return go(x)
        .then(x => "")
        .catch(x => {
          console.error(x);
          return "";
        });
    }, query_result.rows.filter(x => !!x.landing_page));

    console.log('Done');

  } finally {

    await browser.close();

  }
}

main()
.then(x => void 8)
.catch(e => console.error(e))
