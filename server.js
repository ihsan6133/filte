const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const { log } = require("console");

process.chdir("D:/");
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));



app.get("/", (req, res)=> {
    res.redirect("/files/");
})

app.get("/files(/*)?", (req, res) => {
    
    const unsafe_path = decodeURIComponent( req.params[0]);
    
    // Sanintize the path

    const unjoined_path = path.normalize(unsafe_path).replace(/^(\.\.(\/|\\|$))+/, '');
    const safe_path = path.join(process.cwd(), unjoined_path);
    
    // Verify is the path exists 
    if (!fs.existsSync(safe_path))
    {
        res.status(404).send(`Error: Path does not exist (${safe_path})`);
        return;
    }
    
    // If path is a file, send it.
    if (fs.lstatSync(safe_path).isFile())
    {
        res.sendFile(safe_path);
        return;
    }

    
    // If a path is directory, send directory.ejs file with valid templates.
    if (fs.lstatSync(safe_path).isDirectory())
    {
        // Loop through files and directories.
        let num_dirs = 0;
        let num_files = 0;
        let files = [

        ]
        fs.readdirSync(safe_path, { withFileTypes: true }).forEach(file=>{
            let type = null;
            if (file.isFile())
            {
                num_files++;
                type = "file";
            }
            else if (file.isDirectory())
            {
                num_dirs++
                type = "directory";
                
            }
            if (file.isFile() || file.isDirectory())
            {
                files.push({
                    "name": file.name,
                    "type": type,
                    "path": path.join("/files", unjoined_path, encodeURIComponent(file.name))
                })
            }
        });
        // Loop through the current directory path and sent individual segments to client.
        const path_segments = [

        ]
        // console.log(`unjoined_path: ${unjoined_path}`);
        let components = unjoined_path.slice(1).split(path.sep);
        for (let i = 0; i < components.length; i++) {
            const segment = {
                name: components[i],
                path: path.join("/files", ...components.slice(0, i + 1))
            };

            path_segments.push(segment);
            // console.log(`${i} => [${segment.name}, ${segment.path}] slice => ${components.slice(0, i + 1)}`);
        }

        res.render("directory", {
            "dir": unjoined_path.replace(/\\/g, "/"), 
            "files": files, 
            "num_dirs": num_dirs, 
            "num_files": num_files,
            "path_segments": path_segments});
        return;
    }
    


    res.send("Error occured!");
})

app.listen(3000);