//github: furkancelenk - 190403023 (BACKEND) -----------------------------

//require kısımları backend için işimizi kolaylaştırıcak paketleri eklemimiz içindir
//bu paketlerden http ve https rapidapi bağlanıtıs için kullanılır
//mongoose mongoDB database bağlantısı için kullanılır
//cors html dosyamızla sorunsuz iletişim için kullanılır
//body-parser post methodu içinde düzgün veri akışı için kullanılır
//path ve fs modülleri front-end dosyalarımızın konumuna erişmek için kullanılır
var path = require("path"),
    fs = require("fs");
const express = require('express');
const app = express();
var cors = require('cors');
const https = require('https');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
//alt satırımız mongoDB bağlantı adresimizi kaydettiğimiz satırdır
var mongoDB = 'mongodb://localhost/countries';
var urlencodedParser = bodyParser.urlencoded({
  extended: true
});
var jsonParser = bodyParser.json()
//cors kullanıma açıldı
app.use(cors());
//front end klasörümüze erişim sağlandı
app.use(express.static(path.resolve('../front')));

//github: sinemalgul - 190403135 (database)(MONGOODB) ---------------------

//mongoDB bağlantısı oluşturuldu.
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//ülkelerin bilgileri tutan arrayımız
var countryList = [];
//ülkelerin adını tutan arrayımız
var countryNameList = [];
//MONGOOSE ÜLKE ŞEMASI
const countrySchema = new mongoose.Schema({
  country_name: String,
  population: Number,
  ranking: Number,
  world_share: Number
});
//YUKARDAKİ ŞEMAYI KULLANARAK ÜLKELERİ NASIL KAYDEDECEĞİMİZİ AÇIKLADIĞIMIZ KOD
const Country = mongoose.model("Country", countrySchema);

//github: sinemalgul - 190403135 (database) --------------------

//github: furkancelenk - 190403023 BACKEND ---------------------------
//GET REQUESTLERDE KULLANMAK ÜZERE URLDEKİ BOŞLUK VE + KARAKTERLERİNİ %20 KARAKTERİNE ÇEVİREN FONKSİYON
function removeSpacesandSpecial(string) {
  while (string.includes(' ')) {
    string = string.replace(' ', '%20')
  }
  while (string.includes('&')) {
    string = string.replace('&', '%26')
  }
  while (string.includes('+')) {
    string = string.replace('+', '%20')
  }
  return string;
}
//RAPIDAPIDAN ÜLKELERİN İSMİNİ ÇEKMEK İÇİN KULLANDIĞIMIZ SEÇENEKLER
const countryNameOptions = {
  "method": "GET",
  "hostname": "world-population.p.rapidapi.com",
  "port": null,
  "path": "/allcountriesname",
  "headers": {
    "x-rapidapi-host": "world-population.p.rapidapi.com",
    "x-rapidapi-key": "6ddc4ab186msh136e9e8cc3443c1p1a701fjsnc59d6687583e",
    "useQueryString": true
  }
};
//ANASAYFA GET FONKSİYONUMUZ - RAPIAPIDAN ÜLKELERİN İSMİNİ ÇEKER VE ANASAYFAMIZI(index.html) kullanıcıya gönderir
app.get('/', (req, res) => {
  https.get(countryNameOptions, (response) => {
    response.on('data', (data) => {
      const countriesNameList = JSON.parse(data);
      const limit = countriesNameList.body.countries.length;
      for (let i = 0; i < limit; i++) {
        countryNameList.push(countriesNameList.body.countries[i]);
      }
      countryNameList.sort();
    });
  })
  res.sendFile(path.resolve('../front/index.html'));
});

//RAPID APIDAN ÜLKE ADINA ÖZEL ARAMA YAPRAK ÜLKELERİN NÜFUS VERİLERİNİ ÇEKEN FONKSİYONUMUZ
//EN ALTTAKİ POST METHODU BU FONKSİYON SAYESİNDE RAPIDAPIDAN VERİ ALIR
app.get('/search', (req, res) => {
  //EĞER KULLANICI ÜLKE ADINI BOŞ GİRERSE 404 HATASI VER
    if (!req.query.param) {
      res.status(404).send('Bad Request');
    } else {
      var countryName = req.query.param;
      //removeSpacesandSpecial FONKSİYONUMUZU KULLANDIK
      countryName = removeSpacesandSpecial(countryName);
      console.log(countryName);
      //ÜLKEYE ÖZEL VERİ ALMAK İÇİN KULLANDIĞIMIZ SEÇENEKLER
      const options = {
        "host": "world-population.p.rapidapi.com",
        "method": "GET",
        "hostname": "world-population.p.rapidapi.com",
        "port": null,
        //ÜLKE ADINI SEÇENEKLERİMİZE AYRICA EKLEMİŞİZ
        "path": "/population?country_name=" + countryName,
        "headers": {
          "x-rapidapi-host": "world-population.p.rapidapi.com",
          "x-rapidapi-key": "6ddc4ab186msh136e9e8cc3443c1p1a701fjsnc59d6687583e",
          "useQueryString": true
        }
      };
      try{
        //HTTP GET KULLANARAK RAPIDAPIDAN VERİ ALMAYA ÇALIŞTIĞIMIZ FONKSİYON
        https.get(options, (response) => {
          response.on('data', (data) => {
            dt = JSON.parse(data);
            //VERİYİ ALDIK İŞLEDİK EĞER VERİ OKEYSE MONGODBYE KAYDEDECEĞİZ
            if(dt.ok==true){
              //MONGOOSE
              //github: sinemalgul - 190403135 (MONGODB DATABASE) -------------------------------
              //MONGOOSE KAYDETME SEÇENEKLERİ
              var filter = {country_name:dt.body.country_name},
                update = {
                  country_name: dt.body.country_name,
                  population: dt.body.population,
                  ranking: dt.body.ranking,
                  world_share: dt.body.world_share
                },
                //EĞER ÜLKE DAHA ÖNCE GİRİLDİYSE BİR DAHA GİRME
                options = {
                  upsert: true,
                  new: true,
                  setDefaultsOnInsert: true
                };
                //SON OLARAK DATABASE'E ÜLKEMİZİ KAYDETTİĞİMİZ FONKSİYON
              Country.findOneAndUpdate(filter, update, options, function(error, result) {
                if (error) return;
              });
              //github: sinemalgul - 190403135(MONGODB DATABASE)---------------------------------
              
              //github: furkancelenk - 190403023 (BACKEND)---------------------------------
              //VERİMİZİ STRİNGE ÇEVİRİRİZ
              dt = JSON.stringify(dt);
              //VERİMİZİ GRAFİK OLUŞTURMAK ÜZERE FRONTEND AJAX(JAVASCRİPTE) YOLLARIZ
              res.json(dt);
            }else{
              //EĞER VERİYİ ÇEKEMEZSEK HATA VERİRİZ
              res.status(404).send('Bad Request');
            }

          });
        });
      }
      catch(error){console.error(error)}
    }
  }

);
//SERVERIMIZI ÇALIŞTIRAN ASIL FONKSİYONUMUZ
//KULLANICI http://localhost:3000 adresine girdiği zaman direk sitemizle karşılaşır
app.listen(3000, () => {
  console.log('server is running on port 3000')
});

//KULLANICI ARAMA YAPTIĞINDA BU POST METHODU KULLANILIR
//BU POST METHODU DA YUKARDAKİ GET METHODUNU KULLANARAK RAPIDAPIDAN VERİYİ ALIR VE INDEX.HTMLE GÖNDERİR
app.post('/postman', urlencodedParser, (req, res) => {
  //PARAM DEMEK KULLANICIN ARADIĞI ÜLKENİN ADIDIR
  //EĞER BOŞA HATA ALIRIZ
    var  param = req.body.search;
  url = 'http://localhost:3000/search?param=' + param;
  console.log(url);
  http.get('http://localhost:3000/search?param=' + param, (response) => {
    if(response.statusCode!=404){
      response.on('data', (data) => {
        res.json(JSON.parse(data));
      });
    }else{
      res.status(404).send('Bad Request');
    }

  });
});
//github: furkancelenk - 190403023 ------------------------------
