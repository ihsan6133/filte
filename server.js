const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const { log } = require("console");

process.chdir("D:/");
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
        res.sendFile(safe_path);
        return;
    }

    
    // If a path is directory, send files inside
    if (fs.lstatSync(safe_path).isDirectory())
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