const THUMBNAIL_DIRECTORY = "D:\\filte\\thumbnails\\";
const WORKING_DIRECTORY = "D:\\media";

const FFMPEG_PATH = "D:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe";
const FFPROBE_PATH = "D:\\Program Files\\ffmpeg\\bin\\ffprobe.exe";

const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const { log } = require("console");
const sharp = require("sharp");
const { mkdirp }  = require("mkdirp")
const ffmpeg = require("fluent-ffmpeg");
const videoExtensions = require('video-extensions');


ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);



process.chdir(WORKING_DIRECTORY);

app.use(express.static(path.join(__dirname, 'public')));



app.get("/", (req, res)=> {
    res.sendFile("/views/index.html", {root: __dirname});
})

app.get("/files(/*)?", (req, res) => {
    
    const unsafe_path = decodeURIComponent( req.params[0]);
    
    // Sanintize the path

    const unjoined_path = path.normalize(unsafe_path).replace(/^(\.\.(\/|\\|$))+/, '');
    const safe_path = path.join(process.cwd(), unjoined_path);
    
    // Verify is the path exists 
    if (!fs.existsSync(safe_path))
    {
        res.status(404).json({error: "Does not exist"});
        return;
    }
    
    // If path is a file, send it.
    if (fs.lstatSync(safe_path).isFile())
    {

        if (req.query.thumbnail != null)
        {
            const extension = path.extname(safe_path).slice(1).toLowerCase();
            const thumbnail_path = path.join(THUMBNAIL_DIRECTORY, unjoined_path);
            if (fs.existsSync(thumbnail_path))
            {
                res.type("image/webp").sendFile(thumbnail_path);
            }
            else if(["jpeg", "jpg", "png"].includes(extension))
            {
                sharp(safe_path).webp({quality: 80}).resize({width: 160}).rotate().toBuffer().then((data)=>{
                    res.type("image/webp").send(data);
                    mkdirp(path.dirname(thumbnail_path)).then(made=>{
                        fs.writeFile(thumbnail_path, data, ()=>{});
                    });
                });
            }
            else if (videoExtensions.includes(extension))
            {
                console.log(safe_path);

                mkdirp(path.dirname(thumbnail_path)).then(made=>{
                    ffmpeg(safe_path)
                    .on('end', ()=>{
                        res.type('image/webp').sendFile(thumbnail_path);
                    })
                    .on('error', function(err, stdout, stderr) {
                        console.log('Cannot process video: ' + err.message);
                    })
                    
                    .screenshots({
                        timestamps: ['0'],
                        filename: path.basename(thumbnail_path),
                        folder: path.dirname(thumbnail_path),
                        size: '160x?'
                    })
                    .outputFormat("webp")
                    .outputOption('-quality 80')

                });


            }
            return;
    
        }


        console.log(safe_path);
        res.sendFile(safe_path);
        return;
    
    }

    
    // If a path is directory or symlink, send files inside
    if (fs.lstatSync(safe_path).isDirectory() || fs.lstatSync(safe_path).isSymbolicLink())
    {
        // Loop through files and directories.

        fs.readdir(safe_path, {withFileTypes: true}, (error, files)=>{
            if (error) {
                console.error(`Error occurred: ${error}`);
                res.status(500).json({"error": error});
            }
            else
            {
                res.json({
                    error: 0,
                    files: files.map(file=>(
                        {
                            name: file.name,
                            type: ((file)=>{
                                if (file.isDirectory()) return "directory"
                                if (file.isFile()) return "file"
                                if (file.isSymbolicLink()) return "symlink"
                                else return "other"
                            })(file),
                            path: path.join(unjoined_path, file.name)
                        }
                    )),
                })
            }

        })
        return;
    }
    


    res.send("Error occured!");
})

app.listen(3000);
