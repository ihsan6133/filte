// TODO: Fix segment onclick

const files_ul = document.querySelector(".ul-files");
const dir_info_span = document.querySelector(".dir-info");
const path_segments_span = document.querySelector(".path-segments");

let current_dir = "/";


let observer = new IntersectionObserver((entries, observer)=>{
    console.log(entries);
    entries.forEach((entry)=>{
        if (entry.isIntersecting)
        {    
            entry.target.src = `/files${entry.target.file_path}?thumbnail`;
            observer.unobserve(entry.target);
        }
    })
}, {rootMargin: "500px 0%"});

function generate_path_segments(path)
{
    const container = path_segments_span;
    container.innerHTML = '';
    container.classList.add("path-segments");
    
    const root = document.createElement("span");
    root.classList.add("segment");
    root.innerText = '~';
    root.onclick = (event) => {
        navigate_to('/');
    } 

    container.appendChild(root);

    const segments = path.split(/[\/\\]/).slice(1);
    for (let i = 0; i < segments.length; i++) {
        const name = segments[i];
        if (name == '')
            break;

        const seg_path = '/' + segments.slice(0, i + 1).join('/'); 
        console.log(`Seg: ${name} -> ${path}`);

        container.insertAdjacentText("beforeend", "/");

        const seg = document.createElement("span");
        seg.classList.add("segment")
        seg.innerText = name;
        seg.dir_path = seg_path;
        seg.addEventListener("click",(event) => {
            navigate_to(event.currentTarget.dir_path);
        });

        container.appendChild(seg);
        console.log(container);
    }


    return container;
}

function generate_element(file)
{
    const container = document.createElement("div");
    container.title = file.name;
    container.classList.add("file-container");
    
    const icon_container = document.createElement("div");
    icon_container.classList.add("file-icon-container");
    const icon = document.createElement("img");
    icon.classList.add("file-icon");

    icon_container.appendChild(icon);
    if(file.type == "directory")
    {
        icon.src = "/images/dir-icon.svg";
    }
    else if (file.type == "symlink")
    {
        icon.src = "/images/symlink-icon.svg";
    }
    else if (file.type == "file")
    {
        if (["jpeg", "jpg", "png"].includes(file.name.split('.').pop().toLowerCase()))
        {
            
            icon.file_path = file.path;
            
            observer.observe(icon);
            
        }
        else if ([
            "3g2",
            "3gp",
            "aaf",
            "asf",
            "avchd",
            "avi",
            "drc",
            "flv",
            "m2v",
            "m3u8",
            "m4p",
            "m4v",
            "mkv",
            "mng",
            "mov",
            "mp2",
            "mp4",
            "mpe",
            "mpeg",
            "mpg",
            "mpv",
            "mxf",
            "nsv",
            "ogg",
            "ogv",
            "qt",
            "rm",
            "rmvb",
            "roq",
            "svi",
            "vob",
            "webm",
            "wmv",
            "yuv"
        ].includes(file.name.split('.').pop().toLowerCase()))
        {
            icon.file_path = file.path;
            observer.observe(icon);

            const play_video_icon = document.createElement("img");
            play_video_icon.classList.add("play-video-icon");
            play_video_icon.src = "/images/play-video-icon.svg";
            icon_container.appendChild(play_video_icon);


        }
        
        icon.src = "/images/file-icon.svg";
        
    }
    
    const name = document.createElement("span");
    name.classList.add("file-name");
    name.innerText = file.name;
    
    
    container.append(icon_container, name);
    container.file_data = file;
    
    container.addEventListener("click", (event)=> {
        const file = event.currentTarget.file_data;
        if (file.type == "directory" || file.type == "symlink")
        {
            navigate_to(file.path);
        }
        else if (file.type == "file")
        {
            window.location.href = `/files/${encodeURIComponent(file.path.slice(1))}`;
        }
    })
    
    
    return container;
}


function fill_data(data)
{
    
    files_ul.innerHTML = '';
    data.files.forEach(file => {
        files_ul.appendChild(generate_element(file));
    });
    
    generate_path_segments(current_dir);
    

    dir_info_span.innerHTML = '';

    
    console.log(`Num Files: ${data.files.length}`);
    
    

    
}

function set_dir(dir) {
    files_ul.innerHTML = 'Loading..';
    current_dir = dir;
    fetch(`/files${dir}`)
        .then(res => res.json())
        .then(data=>{
            fill_data(data);
        })
        .catch(err=> {
            console.error(`Error: ${err}`);
        });
}

function navigate_to(dir) {
    console.log("State Pushed");
    set_dir(dir);
    history.pushState({path: current_dir}, "");
}

window.addEventListener("popstate", (event)=>{

    console.log(event.state);
    const state = event.state;
    if (state && state.path)
    {
        console.log(state.path);
        set_dir(state.path);
    }
    else
    {
        console.error("Path does not exist!");
    }
})


history.replaceState({path: current_dir}, "");
set_dir('/');
