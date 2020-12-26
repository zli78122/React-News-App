'use strict';
const express = require('express');
const request = require('request');
const googleTrends = require('google-trends-api');
const app = express();
const GUARDIAN_API_KEY = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX';
const NYTIMES_API_KEY = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

app.use(express.static('public'));

// Guardian For Android NewsApp
{
  // Latest News
  app.get('/guardian/latest_news', (req, resp) => {
    const url = `https://content.guardianapis.com/search?order-by=newest&show-fields=starRating,headline,thumbnail,short-url&api-key=${GUARDIAN_API_KEY}&page-size=20`;
    request(url, {}, (error, response, body) => {
      body = JSON.parse(body);
      let data = parse_latest_news(body, false);
      resp.send(data);
    })
  });

  function parse_latest_news(body, parseImageInBlocks) {
    if (body["response"] && body["response"]["status"] === 'ok') {
      let data = [];
      let results = body['response']['results'];
      for (let i = 0; i < results.length; i++) {
        let news_data = parse_single_latest_news(results[i], parseImageInBlocks);
        if (news_data !== '') {
          data.push(news_data);
          if (data.length === 10) {
            break;
          }
        }
      }
      return {status: 'ok', data: data};
    } else {
      let msg = 'unknown error';
      if (body['message']) {
        msg = body['message'];
      } else if (body['response'] && body['response']['status'] && body['response']['status'] === 'error'
          && body['response']['message']) {
        msg = body['response']['message'];
      }
      return {status: 'error', msg: msg};
    }
  }

  function parse_single_latest_news(result, parseImageInBlocks) {
    let id = result['id'].trim();
    let title = result['webTitle'].trim();
    let section = result['sectionName'].trim();
    let time = result['webPublicationDate'].trim();
    let image = 'https://assets.guim.co.uk/images/eada8aa27c12fe2d5afa3a89d3fbae0d/fallback-logo.png';

    if (parseImageInBlocks === false) {
      if (result['fields'] && result['fields']['thumbnail']) {
        image = result['fields']['thumbnail'].trim();
      }
    } else {
      if (result['blocks'] && result['blocks']['main'] && result['blocks']['main']['elements']
          && result['blocks']['main']['elements'][0] && result['blocks']['main']['elements'][0]['assets']
          && result['blocks']['main']['elements'][0]['assets'].length > 0) {
        let images = result['blocks']['main']['elements'][0]['assets'];
        if (images[images.length - 1]['file']) {
          image = images[images.length - 1]['file'];
        }
      }
    }

    if (id !== '' && title !== '' && section !== '' && time !== '') {
      return {id: id, title: title, image: image, section: section, time: time};
    } else {
      return '';
    }
  }

  // http://content.guardianapis.com/world?api-key=[YOUR_API_KEY]&show-blocks=all&page-size=20
  app.get('/guardian/latest_section_news', (req, resp) => {
    const section = req.query['section'];
    const url = `http://content.guardianapis.com/${section}?api-key=${GUARDIAN_API_KEY}&show-blocks=all&page-size=20`;
    request(url, {}, (error, response, body) => {
      body = JSON.parse(body);
      let data = parse_latest_news(body, true);
      resp.send(data);
    })
  });

  // https://content.guardianapis.com/search?q=[QUERY_KEYWORD]&api-key=[YOUR_API_KEY]&show-blocks=all&page-size=20
  app.get('/guardian/searchByKeyword', (req, resp) => {
    const keyword = req.query['keyword'];
    const url = `https://content.guardianapis.com/search?q=${keyword}&api-key=${GUARDIAN_API_KEY}&show-blocks=all&page-size=20`;
    request(url, {}, (error, response, body) => {
      body = JSON.parse(body);
      let data = parse_latest_news(body, true);
      resp.send(data);
    })
  });

  // https://content.guardianapis.com/[ARTICLE_ID]?api-key=[YOUR_API_KEY]&show-blocks=all
  app.get('/guardian/searchById', (req, resp) => {
    const id = req.query['id'];
    const url = `https://content.guardianapis.com/${id}?api-key=${GUARDIAN_API_KEY}&show-blocks=all`;
    request(url, {}, (error, response, body) => {
      body = JSON.parse(body);
      let data = parse_article_by_id(body['response']['content']);
      if (data !== '') {
        resp.send({status: 'ok', data: data});
      } else {
        resp.send({status: 'error', msg: 'the news is now unavailable!'});
      }
    })
  });

  function parse_article_by_id(result) {
    let title = result['webTitle'].trim();
    let section = result['sectionName'].trim();
    let time = result['webPublicationDate'].trim();
    let url = result['webUrl'].trim();

    let image = 'https://assets.guim.co.uk/images/eada8aa27c12fe2d5afa3a89d3fbae0d/fallback-logo.png';
    if (result['blocks'] && result['blocks']['main'] && result['blocks']['main']['elements']
        && result['blocks']['main']['elements'][0] && result['blocks']['main']['elements'][0]['assets']
        && result['blocks']['main']['elements'][0]['assets'].length > 0) {
      let images = result['blocks']['main']['elements'][0]['assets'];
      if (images[images.length - 1]['file']) {
        image = images[images.length - 1]['file'];
      }
    }

    let description = '';
    if (result['blocks'] && result['blocks']['body'] && result['blocks']['body'].length > 0) {
      let body_array = result['blocks']['body'];
      for (let i = 0; i < body_array.length; i++) {
        if (body_array[i]['bodyHtml']) {
          description += (body_array[i]['bodyHtml'] + ' ');
        }
      }
    }

    if (title !== '' || section !== '' || time !== '' || description !== '' || url !== '') {
      return {title: title, image: image, section: section, time: time, description: description, url: url};
    } else {
      return '';
    }
  }
}

// Google Trends API
{
  // http://localhost:5000/trending?keyword=amazon
  app.get('/trending', (req, resp) => {
    const keyword = req.query['keyword'];
    googleTrends.interestOverTime({keyword: keyword, startTime: new Date('2019-06-01'), endTime: new Date(Date.now())})
        .then(function(results){
          let res = [];
          let body = JSON.parse(results);
          if (body['default'] && body['default']['timelineData'] && body['default']['timelineData'].length > 0) {
            let data = body['default']['timelineData'];
            for (let i = 0; i < data.length; i++) {
              if (data[i]['value'] && data[i]['value'].length > 0) {
                res.push(data[i]['value'][0]);
              }
            }
          }
          resp.send({status: 'ok', res: res});
        })
        .catch(function(err){
          resp.send({status: 'error', msg: err});
        });
  });
}

// Guardian
{
  // Home page
  app.get('/home', (req, resp) => {
    const url = `https://content.guardianapis.com/search?api-key=${GUARDIAN_API_KEY}&section=(sport|business|technology|politics)&show-blocks=all&page-size=20`;
    request(url, {}, (error, response, body) => {
      body = JSON.parse(body);
      let data = parse_news_cards(body, 'all');
      resp.send(data);
    })
  });

  // Section page [World | Politics | Business | Technology | Sport]
  // https://content.guardianapis.com/[SECTION_NAME]?api-key=[YOUR_API_KEY]&show-blocks=all
  app.get('/section', (req, resp) => {
    const section = req.query['section'];
    const url = `https://content.guardianapis.com/${section}?api-key=${GUARDIAN_API_KEY}&show-blocks=all&page-size=20`;
    request(url, {}, (error, response, body) => {
      body = JSON.parse(body);
      let data = parse_news_cards(body, section);
      resp.send(data);
    })
  });

  function parse_news_cards(body, section) {
    if (body["response"] && body["response"]["status"] === 'ok') {
      let data = [];
      let results = body['response']['results'];
      for (let i = 0; i < results.length; i++) {
        let news_data = parse_single_news(results[i]);
        if (news_data !== '') {
          data.push(news_data);
          if (data.length === 10) {
            break;
          }
        }
      }
      return {status: 'ok', data: data, section: section};
    } else {
      let msg = 'unknown error';
      if (body['message']) {
        msg = body['message'];
      } else if (body['response'] && body['response']['status'] && body['response']['status'] === 'error'
          && body['response']['message']) {
        msg = body['response']['message'];
      }
      return {status: 'error', msg: msg};
    }
  }

  function parse_single_news(result) {
    let id = result['id'];
    let title = result['webTitle'];
    let url = result['webUrl'];

    let images = [];
    let image = '';
    if (result['blocks'] && result['blocks']['main'] && result['blocks']['main']['elements']
        && result['blocks']['main']['elements'][0] && result['blocks']['main']['elements'][0]['assets']) {
      images = result['blocks']['main']['elements'][0]['assets'];
    }
    let width = 0, height = 0;
    if (images.length !== 0 && images[images.length - 1]['file'] && images[images.length - 1]['typeData']
        && images[images.length - 1]['typeData']['width'] && images[images.length - 1]['typeData']['height']) {
      image = images[images.length - 1]['file'];
      width = images[images.length - 1]['typeData']['width'];
      height = images[images.length - 1]['typeData']['height'];
    }
    if (image === '') {
      image = 'https://assets.guim.co.uk/images/eada8aa27c12fe2d5afa3a89d3fbae0d/fallback-logo.png';
      width = 1200;
      height = 630;
    }

    let section = result['sectionId'].toUpperCase();

    let date = '';
    if (result['webPublicationDate'] && result['webPublicationDate'].length >= 10) {
      date = result['webPublicationDate'].substring(0, 10);
    }

    let description = '';
    if (result['blocks'] && result['blocks']['body'] && result['blocks']['body'][0]) {
      description = result['blocks']['body'][0]['bodyTextSummary'];
    }

    if (id.trim() !== '' && url !== '' && title.trim() !== '' && section !== '' && date !== '' && description !== '') {
      return {id: id, url: url, title: title, image: image, width: width, height: height, section: section, date: date, description: description};
    } else {
      return '';
    }
  }

  // http://localhost:5000/searchById?id=sport/2020/mar/31/rugby-australia-agm-financial-crisis
  app.get('/searchById', (req, resp) => {
    const id = req.query['id'];
    const url = `https://content.guardianapis.com/${id}?api-key=${GUARDIAN_API_KEY}&show-blocks=all`;
    request(url, {}, (error, response, body) => {
      body = JSON.parse(body);
      let data = parse_single_news(body['response']['content']);
      if (data !== '') {
        resp.send({status: 'ok', data: data});
      } else {
        resp.send({status: 'error', msg: 'the news is now unavailable!'});
      }
    })
  });

  // https://content.guardianapis.com/search?q=[QUERY_KEYWORD]&api-key=[YOUR_API_KEY]&show-blocks=all
  app.get('/searchByKeyword', (req, resp) => {
    const q = req.query['q'];
    const url = `https://content.guardianapis.com/search?q=${q}&api-key=${GUARDIAN_API_KEY}&show-blocks=all&page-size=20`;
    request(url, {}, (error, response, body) => {
      body = JSON.parse(body);
      let data = parse_news_cards(body, 'all');
      resp.send(data);
    })
  });
}

// NYTimes
{
  // Home Tab
  // https://api.nytimes.com/svc/topstories/v2/home.json?api-key=[YOUR_API_KEY]

  // Other Tabs
  // https://api.nytimes.com/svc/topstories/v2/[SECTION_NAME].json?api-key=[YOUR_API_KEY]

  // SearchByID
  // https://api.nytimes.com/svc/search/v2/articlesearch.json?fq=web_url:("[ARTICLE_WEB_URL]")&api-key=[API_KEY]

  app.get('/nyHome', (req, resp) => {
    const url = `https://api.nytimes.com/svc/topstories/v2/home.json?api-key=${NYTIMES_API_KEY}`;
    request(url, {}, (error, response, body) => {
      try {
        body = JSON.parse(body);
      } catch (e) {
        resp.send({status: 'error', msg: e.message});
        return;
      }
      let data = parse_nytimes_news(body, 'all');
      resp.send(data);
    })
  });

  // http://localhost:5000/nySection?section=world
  app.get('/nySection', (req, resp) => {
    const section = req.query['section'];
    const url = `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${NYTIMES_API_KEY}`;
    request(url, {}, (error, response, body) => {
      try {
        body = JSON.parse(body);
      } catch (e) {
        resp.send({status: 'error', msg: e.message});
        return;
      }
      let data = parse_nytimes_news(body, section);
      resp.send(data);
    })
  });

  function parse_nytimes_news(body, section) {
    if (body["status"] === 'OK') {
      let data = [];
      let results = body['results'];
      for (let i = 0; i < results.length; i++) {
        let news_data = parse_single_nytimes(results[i]);
        if (news_data !== '') {
          data.push(news_data);
          if (data.length === 10) {
            break;
          }
        }
      }
      return {status: 'ok', data: data, section: section};
    } else {
      let msg = 'unknown error';
      return {status: 'error', msg: msg};
    }
  }
  
  function parse_single_nytimes(result) {
    let title = result['title'];
    let section = result['section'].toUpperCase();
    let description = result['abstract'];
    let date = '';
    if (result['published_date'] && result['published_date'].length >= 10) {
      date = result['published_date'].substring(0, 10);
    }
    let url = result['url'];
    let id = result['url'];

    let image = '';
    if (result['multimedia'] && result['multimedia'].length > 0) {
      for (let i = 0; i < result['multimedia'].length; i++) {
        if (result['multimedia'][i]['url'] && result['multimedia'][i]['width'] && result['multimedia'][i]['width'] >= 2000) {
          image = result['multimedia'][i]['url'];
          break;
        }
      }
    }
    if (image === '') {
      image = 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Nytimes_hq.jpg';
    }

    if (id.trim() !== '' && url !== '' && title.trim() !== '' && section !== '' && date !== '' && description !== '') {
      return {id: id, url: url, title: title, image: image, section: section, date: date, description: description};
    } else {
      return '';
    }
  }

  app.get('/nySearchById', (req, resp) => {
    const id = req.query['id'];
    const url = `https://api.nytimes.com/svc/search/v2/articlesearch.json?fq=web_url:("${id}")&api-key=${NYTIMES_API_KEY}`;
    request(url, {}, (error, response, body) => {
      try {
        body = JSON.parse(body);
      } catch (e) {
        resp.send({status: 'error', msg: e.message});
        return;
      }
      let data = {};
      if (body['status'] === 'OK' && body['response'] && body['response']['docs'] && body['response']['docs'].length > 0) {
        data = parseNYTimesById(body['response']['docs'][0]);
        resp.send({status: 'ok', data: data});
      } else {
        resp.send({status: 'error', msg: 'the news is now unavailable!'});
      }
    })
  });

  function parseNYTimesById(result) {
    let title = 'Unknown Title';
    if (result['headline'] && result['headline']['main']) {
      title = result['headline']['main'];
    }
    let section = '';
    if (result['news_desk']) {
      section = result['news_desk'].toUpperCase();
    }
    let description = 'Unknown Description';
    if (result['abstract']) {
      description = result['abstract'];
    }
    let date = 'Unknown Date';
    if (result['pub_date'] && result['pub_date'].length >= 10) {
      date = result['pub_date'].substring(0, 10);
    }
    let url = 'Unknown Url';
    let id = 'Unknown Id';
    if (result['web_url']) {
      url = result['web_url'];
      id = result['web_url'];
    }
    let image = 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Nytimes_hq.jpg';
    let width = 3008, height = 2000;
    if (result['multimedia'] && result['multimedia'].length > 0) {
      for (let i = 0; i < result['multimedia'].length; i++) {
        if (result['multimedia'][i]['url'] && result['multimedia'][i]['width'] && result['multimedia'][i]['width'] >= 2000 && result['multimedia'][i]['height']) {
          image = 'https://www.nytimes.com/' + result['multimedia'][i]['url'];
          width = result['multimedia'][i]['width'];
          height = result['multimedia'][i]['height'];
          break;
        }
      }
    }
    return {id: id, url: url, title: title, image: image, width: width, height: height, section: section, date: date, description: description};
  }

  // https://api.nytimes.com/svc/search/v2/articlesearch.json?q=[QUERY_KEYWORD]&api-key=[YOUR_API_KEY]
  app.get('/nySearchByKeyword', (req, resp) => {
    const q = req.query['q'];
    const url = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${q}&api-key=${NYTIMES_API_KEY}`;
    request(url, {}, (error, response, body) => {
      try {
        body = JSON.parse(body);
      } catch (e) {
        resp.send({status: 'error', msg: e.message});
        return;
      }
      let data = [];
      if (body['status'] === 'OK' && body['response'] && body['response']['docs'] && body['response']['docs'].length > 0) {
        for (let i = 0; i < body['response']['docs'].length; i++) {
          data.push(parseNYTimesById(body['response']['docs'][i]));
        }
        resp.send({status: 'ok', data: data, section: 'all'});
      } else {
        resp.send({status: 'error', msg: 'no results!'});
      }
    })
  });
}

app.get('/', (request, response) => {
  response.sendFile(__dirname+'/public/index.html');
});

app.get('/index', (request, response) => {
  response.sendFile(__dirname+'/public/index.html');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;
