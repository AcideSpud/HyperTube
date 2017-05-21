/**
 * Created by Tom on 20/05/2017.
 */
var torrentStream = require('torrent-stream');
var pump = require('pump');
var ffmpeg = require('fluent-ffmpeg');
var ffprobe = require('ffprobe');
var fs = require('fs');

class   Video{


    static  getDownInfo(mLink){
        return new Promise((resolve, reject)=>{

        var engine = torrentStream(mLink);
        var info = [];
        engine.on('ready', () => {
            var nb_files = engine.files.length;
            console.log(`===============================================`);
            console.log(`|| Nombre de fichier dans torrents : ${nb_files}`);
            console.log(`===============================================`);
            var compteur = 0;
            var compteurObj = 0;

            engine.files.forEach((file)=> {

                    console.log(`||  Nom des fichiers : ${compteur}. ${file.name}`);
                    if ((file.name.endsWith('.avi') || file.name.endsWith('.mkv') || file.name.endsWith('.mp4')) && (file.name != 'sample.avi' || file.name != 'sample.mkv')) {
                        info[compteurObj] = {name: file.name, size: file.length};
                        compteurObj++;
                    }
                    compteur++;

                });
                console.log(`===============================================`);
                if (info) {
                    console.log(info);
                    resolve(info);
                }
                else {
                    err = 'ERR : NO FILE INFO in OBJ';
                    reject(err)
                }
        });
        })
    };

    static  runStream(name) {
        return new Promise((resolve, reject)=> {
            console.log('WE CAME HERE ONE DAY ! ')
            var fstream = fs.createReadStream('./public/' + name)
                .on('open', () => {
                    console.log(`Beginning READ Mp4 file`);
                    resolve(fstream);
                })
                .on('error', (err) => {
                    console.log(`ERR : ${err}`);
                    reject(err);
                });

        })
    };


    static  getDownFile(mlink){
        return new Promise((resolve, reject)=> {
            var engine = torrentStream(mlink);
                engine.on('ready', () => {
                    var size = 0;
                    let cmp = 0;
                    engine.files.forEach((file) => {
                    if ((file.name.endsWith('.avi') || file.name.endsWith('.mkv')) && (file.name != 'sample.avi' || file.name != 'sample.mkv')) {
                        var datalength = 0;
                        size += file.length;
                        console.log('filename:', file.name);
                        var stream = file.createReadStream(file);
                        var down = fs.createWriteStream('./public/' + file.name);
                        var test = true;

                        stream.on('data', (chunck) => {
                            datalength += chunck.length;
                            if (test) {
                                let percent = 0.05;
                                let fChunk = stat.size * percent;
                                if (datalength > fChunk && test) {
                                    test = false;
                                    this.runStream(file.name).then((stream)=>{
                                        resolve(stream);
                                    }).catch((err)=>{
                                        console.log(`RUN STREAM HAVE FAIL : ${err}`);
                                        reject(`runStream : ${err}`);
                                    });

                                }
                            }

                        });
                        stream.on('error', (err)=>{
                           reject(err);
                        });
                        var command = ffmpeg(stream)
                            .outputOption('-movflags frag_keyframe+faststart')
                            .outputOption('-deadline realtime')
                            .audioCodec('libmp3lame')
                            .videoCodec('libx264')
                            .format('mp4')
                            .audioBitrate(128)
                            .videoBitrate(1024)
                            .size('720x?')
                            .on('error', function(err) {
                                console.log('An error occurred: ' + err.message);
                                reject(err);
                            })
                            .on('end', function() {
                                console.log('Processing finished !');
                            });
                          //  pump(stream, down);
                            pump(command, down);


                        //down.on('finish', () => {
                          //  console.log("corretly down");
                        //});

                    }



                });

            });
        });
    }
    static streamMp4(mLink){
        return new Promise((resolve, reject)=>{
            var engine = torrentStream(mLink);
            engine.on('ready', () => {
                var size = 0;
                console.log('ready');
                engine.files.forEach((file) => {
                    if ((file.name.endsWith('.avi') || file.name.endsWith('.mp4')) && (file.name != 'sample.avi' || file.name != 'sample.mkv')) {
                        var datalength = 0;
                        size = file.length;
                        console.log('filename:', file.name);
                        var stream = file.createReadStream(file);
                        var down = fs.createWriteStream('./public/' + file.name);
                        var test = true;
                        stream.on('open',()=>{
                            console.log('open');
                        });
                        stream.on('data', (chunck) => {
                            datalength += chunck.length;
                            if (test) {
                                let percent = 0.05;
                                let fChunk = size * percent;
                                if (datalength > fChunk && test) {
                                    test = false;
                                        resolve(file.name);

                                }
                            }

                        });
                        stream.on('error', (err)=> {
                            reject(err);
                        });
                        pump(stream, down);
                        down.on('finish', ()=>{
                            console.log("corretly down");
                            engine.destroy();
                        });
                    }
                })
            })
        })
    }
    static mp4Read(res, name){
        let f_stream = fs.createReadStream(`./public/` + name);
        f_stream.on(`open`, ()=>{
            pump(f_stream, res);
            console.log(`beginning Stream ! `);
        });
        f_stream.on('error', (err)=>{
            console.log(`ERROR : ${err}`);
        });
        f_stream.on('data', (chunk)=>{
            //var size = chunk.length;
            //console.log(`Size chunk : ${chunk.length}`);
        });
        f_stream.on('end', ()=>{
            console.log(`End of Stream `);
        })
    }
    static justMp4Stream(mLink, res){
        return new Promise((resolve, reject)=>{
            var engine = torrentStream(mLink);
            engine.on('ready', ()=>{
                console.log(`Engine is ready !`);
                engine.files.forEach((file)=>{
                    if (file.name.endsWith('.mp4')){
                        console.log('Find mp4 File');
                        var stream = file.createReadStream(file);
                        var dataLength = 0;
                        var initialSize = file.size;
                        stream.on('open', ()=>{
                            console.log(`Beginnig Download : ${file.name} `);
                            pump(stream, res);
                        });
                        stream.on('data', (chunk)=>{
                            dataLength += chunk;
                        });
                        stream.on('err', (err)=>{
                           reject(err);
                        });
                        stream.on('end', ()=>{
                           console.log(`end Of Download || InitSIZE : ${initialSize} || Size tot chunck : ${dataLength}`);
                           //engine.destroy();
                           resolve();
                        });

                    }
                })
            })
        })
    }
};


module.exports = Video;