const THUMBNAIL_DIRECTORY = "D:\\filte\\thumbnails\\";
const WORKING_DIRECTORY = "D:\\media";

const FFMPEG_PATH = "D:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe";
const FFPROBE_PATH = "D:\\Program Files\\ffmpeg\\bin\\ffprobe.exe";

const DEVICE_NAME = "My PC";

const express = require("express");
const path = require("path");
const fs = require("fs");
const { log } = require("console");
const sharp = require("sharp");
const { mkdirp }  = require("mkdirp")
const ffmpeg = require("fluent-ffmpeg");
const videoExtensions = require('video-extensions');
const app = express();

// Images supported by sharp library. (Heic/heif is not supported)
const sharp_image_extensions = ["jpg", "jpeg", "png", "gif", "webp"];


// Set the path of ffmpeg binaries.
ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res)=> {
    res.render("index", {device_name: DEVICE_NAME});
})


function sanitizePath(unsafe_path) {
    
    const unjoined_path = path.normalize(unsafe_path).replace(/^(\.\.(\/|\\|$))+/, '');
    const safe_path = path.join(WORKING_DIRECTORY, unjoined_path);
    return {
        unjoined_path,
        safe_path
    }
}


// Sends thumbnail if it exists, otherwise creates a thumbnail and sends it.
function sendThumbnail(res, safe_path, unjoined_path) {
    const extension = path.extname(safe_path).slice(1).toLowerCase();
    const thumbnail_path = path.join(THUMBNAIL_DIRECTORY, unjoined_path);

    // Send thumbnail if it exists
    if (fs.existsSync(thumbnail_path))
    {
        res.type("image/webp").sendFile(thumbnail_path);
    }
    else if(sharp_image_extensions.includes(extension))
    {
        sharp(safe_path).webp({quality: 80}).resize({width: 160}).rotate().toBuffer().then((data)=>{
            res.type("image/webp").send(data);
            mkdirp(path.dirname(thumbnail_path)).then(made=>{
                fs.writeFile(thumbnail_path, data, ()=>{});
            });
        }).catch((err)=>res.status(404).redirect("/images/file-icon.svg"));
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
    else
    {
        res.status(404).redirect("/images/file-icon.svg");
    }

}
app.get("/files(/*)?", (req, res) => {
    
    
    // Sanintize the path
    const unsafe_path = decodeURIComponent( req.params[0]);
    const {unjoined_path, safe_path} = sanitizePath(unsafe_path)
    

    // Verify is the path exists 
    if (!fs.existsSync(safe_path))
    {
        res.status(404).json({error: "Does not exist"});
        return;
    }
    

    // If path is a file, send it.
    if (fs.lstatSync(safe_path).isFile())
    {

        // If thumbnail was passed as a query parameter, send thumbnail
        if (req.query.thumbnail != null)
        {
            sendThumbnail(res, safe_path, unjoined_path);
        }
        // Else send the file as it is
        else
        {
            res.sendFile(safe_path);
        }
        
    }

    
    // If a path is directory or symlink, send files inside
    else if (fs.lstatSync(safe_path).isDirectory() || fs.lstatSync(safe_path).isSymbolicLink())
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
                            extension: path.extname(file.name).slice(1),
                            path: path.join(unjoined_path, file.name)
                        }
                    )),
                })
            }

        })
        return;
    }
    
    else
    {
        res.send("Error occured!");
    }   


})

app.listen(3000);
