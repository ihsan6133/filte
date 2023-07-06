// TODO: Fix segment onclick

const files_ul = document.querySelector(".ul-files");
const dir_info_span = document.querySelector(".dir-info");
const path_segments_span = document.querySelector(".path-segments");
const loading_screen = document.querySelector(".loading-circle");
const image_display = document.querySelector(".image-display");

const image = document.querySelector(".image");
const thumbnail = document.querySelector(".thumbnail");


const image_settings = {
    close: document.querySelector(".image-settings .close")
}

const left_arrow = document.querySelector(".left-arrow");
const right_arrow = document.querySelector(".right-arrow");


let loaded_images = [];
let current_image_index = null;

const file_icons = {
    "directory": "/images/dir-icon.svg",
    "file": "/images/file-icon.svg",
    "symlink": "/images/symlink-icon.svg"
}

const image_file_extensions = ["jpg", "jpeg", "png", "gif", "webp", "raw", "bmp", "avif", "svg"];
const video_extensions = ["3g2", "3gp", "aaf", "asf", "avchd", "avi", "drc", "flv", "m2v", "m3u8", "m4p", "m4v", "mkv", "mng", "mov", "mp2", "mp4", "mpe", "mpeg", "mpg", "mpv", "mxf", "nsv", "ogg", "ogv", "qt", "rm", "rmvb", "roq", "svi", "vob", "webm", "wmv", "yuv"]

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

function isImage(file)
{
    return file.type == "file" && image_file_extensions.includes(file.extension.toLowerCase());
}

function isVideo(file)
{
    return file.type == "file" && video_extensions.includes(file.extension.toLowerCase());
}

function generateIcon(file)
{
    const container = document.createElement("div");
    container.classList.add("file-icon-container");

    const icon = document.createElement("img");
    icon.classList.add("file-icon");
    icon.src = file_icons[file.type];

    if (isImage(file) || isVideo(file))
    {
        icon.file_path = file.path;
        observer.observe(icon);
    }

    container.appendChild(icon);

    if (isVideo(file))
    {
        const play_video_icon = document.createElement("img");
        play_video_icon.classList.add("play-video-icon");
        play_video_icon.src = "/images/play-video-icon.svg";
        container.appendChild(play_video_icon);
    }

    return container;
}

function renderImage(file) {
    image_display.style.visibility = "visible";
    
    thumbnail.src = `/files${file.path}?thumbnail`;
    thumbnail.onload = ()=>{
        thumbnail.style.visibility = "visible"; 
        image.style.visibility = "hidden"
        
    };


    image.src = `/files${file.path}`;
    image.onload = ()=>{
        image.style.visibility = "visible";
        thumbnail.style.visibility = "hidden";
        
    }
}

function generate_element(file)
{

    const container = document.createElement("div");
    container.title = file.name;
    container.classList.add("file-container");
    
    const icon = generateIcon(file);

    const name = document.createElement("span");
    name.classList.add("file-name");
    name.innerText = file.name;
    
    
    container.append(icon, name);
    container.file_data = file;
    
    if (isImage(file))
    {
        loaded_images.push(file);
        container.image_index = loaded_images.length - 1;
    }


    container.addEventListener("click", (event)=> {
        const file = event.currentTarget.file_data;
        if (file.type == "directory" || file.type == "symlink")
        {
            navigate_to(file.path);
        }
        else if (file.type == "file")
        {
            if (isImage(file))
            {
                current_image_index = event.currentTarget.image_index;
                console.log("Image Displayed");
                renderImage(file);

            }
            else
            {
                window.location.href = `/files/${encodeURIComponent(file.path.slice(1))}`;
            }
        }
    })
    
    
    return container;
}


function fill_data(data)
{
    loading_screen.style.display = "none";
    loaded_images = [];


    files_ul.replaceChildren();
    data.files.forEach(file => {
        files_ul.appendChild(generate_element(file));
    });
    
    generate_path_segments(current_dir);
    

    dir_info_span.innerHTML = '';
    console.log(`Num Files: ${data.files.length}`);    
}

function set_dir(dir) {
    files_ul.replaceChildren();
    loading_screen.style.display = "block";
    
 
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

image_settings.close.onclick = (event)=>{
    image_display.style.visibility = "hidden";
    image.src = "";
    thumbnail.src = "";
    image.style.visibility = "hidden";
    thumbnail.style.visibility = "hidden";
    current_image_index = 0;
}

left_arrow.onclick = (event)=>{
    if (current_image_index == 0)
        return;

    current_image_index--;

    
    image.onload = null;
    thumbnail.onload = null;
    renderImage(loaded_images[current_image_index]);
}

right_arrow.onclick = (event)=>{
    if (current_image_index == loaded_images.length - 1)
        return;

    current_image_index++;
    
    image.onload = null;
    thumbnail.onload = null;
    renderImage(loaded_images[current_image_index]);

}

history.replaceState({path: current_dir}, "");
set_dir('/');
