// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc, getDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getCountFromServer} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDaacl1g-63bYmdKk0EzPHMLe5CZLU53Sk",
    authDomain: "zine-builder.firebaseapp.com",
    projectId: "zine-builder",
    storageBucket: "zine-builder.appspot.com",
    messagingSenderId: "1037717512420",
    appId: "1:1037717512420:web:51b5d77bec663069310cf1"
  };

//initialize Firbase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

//create an empty list of image objects
var imagesList = [];
//upload file function, called with image button in a certain page + div
async function storeFile(imageFile, imageContainer){
  try {
      //get project name from firebase and create a reference for it in cloud storage
    const imagesRef = ref(storage, sessionStorage.getItem("projectName"));
      //create cloud storage references for page, div, and image according to their ids in javascript
    const pageRef = ref(imagesRef, imageContainer.parentNode.id);
    const divRef = ref(pageRef, imageContainer.className);
    const storageRef = ref(divRef, imageFile.name);
    console.log(imageFile.name);
      //uploadBytes firebase function to upload the right image in the right reference
    const snapshot = await uploadBytes(storageRef, imageFile)
    console.log("file uploaded to div "+imageContainer.id);
      //get the url of the now uploaded image from colud storage
    var photoURL = await getUrl(storageRef);
    console.log(photoURL);

      //create an image object for the newly uploaded image that will store its url and div as attributes
    const imageObject = {
      url: photoURL,
      location: imageContainer.id,
        fileName:imageFile.name
    }
      //add the new image to the list of all images
    imagesList.push(imageObject);
      //put the list of images in a session storage for later access
    sessionStorage.setItem("imageStorage", JSON.stringify(imagesList));
    console.log(sessionStorage.getItem("imageStorage"));

      //create <img> in html and set the .src to the uploaded image's url
    const img = document.createElement("img");
    img.src = photoURL;
    img.id = "image";
    imageContainer.appendChild(img);
  } catch (error) {
    console.error("Error uploading file: "+ error);
  }
}

//firebase function which returns the url of the image with the given reference in cloud storage
async function getUrl(storageRef){
  return await getDownloadURL(storageRef);
}



//login function for submit button
export const login = function (email, password){
  //call signInWithEmailAndPassword, firebase function
  signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed in 
     
      sessionStorage.setItem('username', userCredential.user.email);
    //sucessful sign-in: update window
    window.location.href = "homepage.html";
  })
  .catch((error) => {
    //error catch log messages
    const errorCode = error.code;
    const errorMessage = error.message;
  });
}

//logout function for logout button on homepage
export const logout = function (){
  //signOut function from Firebase
    signOut(auth)
    .then(() => {
  //successful sign-out, redirect to login page
      window.location.href = "index.html"
    }).catch((error) => {
      //error catch log messages
      const errorCode = error.code;
      const errorMessage = error.message;
    });
  }

//method that makes the Project Name input show up
export const displayInput = function(){
    document.getElementById('projectNamePicker').style.display='unset';
}
//method that makes the Project Name input disappear
export const hideInput = function(){
  document.getElementById('projectNamePicker').style.display='none';
}

export const displayNewProjectButton = function(){
  //create a div with the class projects and onclick event to show the input
  var div = document.createElement("div");
  div.className = "projects";
  div.addEventListener("click", displayInput);
  //create a plus sign and "new project" text
  var plusSign = document.createElement("p");
  plusSign.id = "plus";
  plusSign.innerHTML = "+";
  var para = document.createElement("p");
  para.id="projectText";
  para.innerHTML = "New Project";
  //add div to all projects div
  document.getElementById("allProjects").appendChild(div);
  //add plus sign and text to div
  div.appendChild(plusSign);
  div.appendChild(para);
}

export const newProject = async function(){
  try {
      //saves whatever the user inputs as the name of the collection
      var collectionName = document.getElementById('enterProjectName').value;
      console.log(collectionName)

      var username = sessionStorage.getItem('username');
      console.log(username)

      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let key = '';
      for (let i = 0; i < 16; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        key += characters.charAt(randomIndex);
      }

      collectionName = collectionName +"§"+ username + key;
      console.log(collectionName)
      //creates a new collection since it doesn't exist and makes a document called projectName
      await addDoc(collection(db, collectionName), {
          projectName: collectionName,  
      });
      //adds 2 page documents
      await addDoc(collection(db, collectionName),{
          pageNumber: "front",
          format: "page-0"

      });
      await addDoc(collection(db, collectionName),{
          pageNumber: "back",
          format: "page-0"
      });
      //adds the name of the collection to a seperate collection of names in order to loop through it later
      await addDoc(collection(db, "collection-names"),{
        projectName: collectionName,
        userName: sessionStorage.getItem('username')
      });
      //displays all projects
      showProjects();
  }
  // Print error message if there are any errors
  catch (e) {
    console.error("Error adding item to database: ", e);
  } 
}

export const showProjects = async function(){
  //removes everything from the allProjects div
  document.getElementById("allProjects").innerHTML = "";
  //creates a query of all documents in collection-names
  const q = query(collection(db, "collection-names"), where("userName", "==", sessionStorage.getItem('username')));
  const allProjects = await getDocs(q);
  //shows the new project button
  displayNewProjectButton(); 
  //for each document in collection-names, create and append a div with text in it
  allProjects.forEach((project) =>{
    // console.log(project.data().projectName);
    var newProjectDiv = document.createElement("div");
    newProjectDiv.className = "projects";
    newProjectDiv.addEventListener("click", function(){
      sessionStorage.setItem('projectName',project.data().projectName);
      window.location.href="editor.html";
    });
    document.getElementById("allProjects").appendChild(newProjectDiv);

    var projNameArray = project.data().projectName.split("§");
    console.log(projNameArray[0])

    var stabImage = document.createElement("img");
    stabImage.src = "images/stab.png";
    stabImage.style.width = "13vw";
    newProjectDiv.appendChild(stabImage);

    var newProjectName = document.createElement("p");
    newProjectName.innerHTML = projNameArray[0]; 
    newProjectName.id = "projectText";
    newProjectDiv.appendChild(newProjectName);
  })
}

export const checkLogin = async function(){
  //checking that the user is logged in
  auth.onAuthStateChanged((user) => {
    if (!user) {
      //user is not signed in, redirect to login page
      window.location.href = "index.html";
    }
  })
}

export const deleteProject = async function(){
  alert("Are you sure you want to delete this project?");
  const projName = sessionStorage.getItem('projectName');
  const docsInCollection = await getDocs(collection(db, projName));
  for (const docSnapshot of docsInCollection.docs) {
    await deleteCollection(docSnapshot.id, projName); // Delete each document in the collection
  }
  const r = query(collection(db, "collection-names"), where("projectName", "==", projName));
  const querySnapshot = await getDocs(r);
  for (const document of querySnapshot.docs) {
    await deleteFromCollectionNames(document.id); // Delete the project entry in "collection-names"
  }
  window.location.href ="homepage.html"
  showProjects();
}

async function deleteCollection(docId, projName){

  try {
    // Delete the document from the specific project collection
    await deleteDoc(doc(db, projName, docId));
    // console.log(`Document with ID: ${docId} deleted from collection ${projName}`);
  } catch (error) {
    console.error("Error deleting document:", error);
  }
}

async function deleteFromCollectionNames(docId){
  try {
    // Delete the corresponding project entry from the "collection-names" collection
    await deleteDoc(doc(db, "collection-names", docId));
    // console.log(`Document with ID: ${docId} deleted from collection-names`);
  } catch (error) {
    console.error("Error deleting from collection-names:", error);
  }
}


export const addPages = function () {
  // Create elements
  const allPageContainers = document.getElementsByClassName("pages-container")
  const pagesContainer = document.createElement("div");
  pagesContainer.className = "pages-container";
  var num = allPageContainers.length + 1
  console.log(num)
  pagesContainer.id = "container-"+num;

  // console.log(pagesContainer.className)


  const editor1 = document.createElement("div");
  editor1.className = "editor";
  const editor2 = document.createElement("div");
  editor2.className = "editor";

  // Get the current number of pages to set correct IDs
  const pages = document.querySelectorAll("[class^=page-]");
  const nextPageNum = pages.length + 1;


  const page1 = document.createElement("div");
  page1.className = "page-0";
  page1.id = String(pages.length - 1);

  const page2 = document.createElement("div");
  page2.className = "page-0";
  page2.id = String(pages.length);

  // Tools
  const tools1 = document.createElement("div");
  tools1.className = "tools";
  const tools2 = document.createElement("div");
  tools2.className = "tools";


  // Buttons
  const button1 = document.createElement("button");
  button1.className = "format-button";
  button1.title = "Formats";
  button1.onclick = () => {
    chooseFormat(String(nextPageNum - 2));
  };

  const button2 = document.createElement("button");
  button2.className = "format-button";
  button2.title = "Formats";
  button2.onclick = () => {
    chooseFormat(String(nextPageNum - 1));
  };

  const deleteSection = document.createElement("div")
  deleteSection.className = "delete-section";


  const button3 = document.createElement("button");
  button3.className = "delete-button";
  button3.onclick = async function() {
      if(confirm("Do you want to delete these pages?")==true){
            deletePages(num);
            await saveProject();
            await loadProject();
    }
  };
  

  const span1 = document.createElement("span");
  span1.innerHTML = "dashboard";
  span1.className = "material-symbols-outlined";

  const span2 = document.createElement("span");
  span2.innerHTML = "dashboard";
  span2.className = "material-symbols-outlined";

  const span3 = document.createElement("span");
  span3.innerHTML = "delete";
  span3.className = "material-symbols-outlined";

  // Assemble elements
  button1.appendChild(span1);
  button2.appendChild(span2);

  button3.appendChild(span3);
  deleteSection.appendChild(button3);

  constructForm0(page1);
  constructForm0(page2);

  tools1.appendChild(button1);
  tools2.appendChild(button2);

  editor1.appendChild(page1);
  editor1.appendChild(tools1);

  editor2.appendChild(page2);
  editor2.appendChild(tools2);

  pagesContainer.appendChild(deleteSection);
  pagesContainer.appendChild(editor1);
  pagesContainer.appendChild(editor2);

  // console.log(pagesContainer.id)
  // console.log(pagesContainer.children[0].className)

  document.getElementById("container").appendChild(pagesContainer);


  // Call makePageNums immediately after adding the pages
  makePageNums(page1);
  makePageNums(page2);
};



// all constructForm methods construct a format by clearing a page
// constructForm1 constucts format 1 and so on for formats 1-6
//each construct form method is essentially the same with the only differences being amount of content "cells" and class names designated to said cells
//constructForm# takes a parameter page being the page element in which the format will be constructed

//format for construct form remains mostly the same for each 
//resetting the given page
//making the required number of divs
//making the new text/image buttons and making sure the functions link
//append all the new stuff


function constructForm0(page){
  // console.log("constructing form 0");
  page.innerHTML = "";
  const div1 = document.createElement("div");
  div1.className = "cell-0-1";
  div1.id = page.id+"_1";

  const imginput = document.createElement("input");
  imginput.type = "file"
  imginput.style ="display: none;"
  imginput.id = "image-input";

  //text button 1
  const button1 = document.createElement("button");
  button1.className = "text-button";
  button1.title = "Text";

  //img button 1
  const button2 = document.createElement("button");
  button2.className = "img-button";
  button2.id = "img-button";
  button2.title = "Image";

  // span
  const span1 = document.createElement("span");
  span1.innerHTML = "text_fields"
  span1.className = "material-symbols-outlined";

  const span2 = document.createElement("span");
  span2.innerHTML = "image"
  span2.className = "material-symbols-outlined";

  //APPEND
  button1.appendChild(span1);
  button2.appendChild(span2);
  div1.appendChild(imginput);
  div1.appendChild(button1);
  div1.appendChild(button2);

  page.appendChild(div1);

  reapplyButtonListeners(page);
}


function constructForm1(page){
  //create cell 1
  page.innerHTML = ""
  const div1 = document.createElement("div");
  div1.className = "cell-1-1";
  div1.id = page.id+"_1";
  //create cell 2
  const div2 = document.createElement("div");
  div2.className = "cell-1-2";
  div2.id = page.id+"_2";
  //create cell 3
  const div3 = document.createElement("div");
  div3.className = "cell-1-3";
  div3.id = page.id+"_3"

  //file picker 1, creates the input and then hides it
  const imginput = document.createElement("input");
  imginput.type = "file";
  imginput.style ="display: none;"
  imginput.id = "image-input";

  //text button 1
  const button1 = document.createElement("button");
  button1.className = "text-button";
  button1.title = "Text";

  //img button 1
  const button2 = document.createElement("button");
  button2.className = "img-button";
  button2.id = "img-button";
  button2.title = "Image";

  // span
  const span1 = document.createElement("span");
  span1.innerHTML = "text_fields"
  span1.className = "material-symbols-outlined";

  const span2 = document.createElement("span");
  span2.innerHTML = "image"
  span2.className = "material-symbols-outlined";

  //file picker 2
  const imginput2 = document.createElement("input");
  imginput2.type = "file";
  imginput2.style ="display: none;"
  imginput2.id = "image-input2";

  //text button 2
  const button21 = document.createElement("button");
  button21.className = "text-button";
  button21.title = "Text";

  //image button 2
  const button22 = document.createElement("button");
  button22.className = "img-button";
  button22.id = "img-button";
  button22.title = "Image";

  // span
  const span21 = document.createElement("span");
  span21.innerHTML = "text_fields"
  span21.className = "material-symbols-outlined";

  const span22 = document.createElement("span");
  span22.innerHTML = "image"
  span22.className = "material-symbols-outlined";

  //file picker 3
  const imginput3 = document.createElement("input");
  imginput3.type = "file";
  imginput3.style ="display: none;"
  imginput3.id = "image-input3";

  //text button 3
  const button31 = document.createElement("button");
  button31.className = "text-button";
  button31.title = "Text";


  //img button 3
  const button32 = document.createElement("button");
  button32.className = "img-button";
  button32.id = "img-button";
  button32.title = "Image";

  // span
  const span31 = document.createElement("span");
  span31.innerHTML = "text_fields"
  span31.className = "material-symbols-outlined";

  const span32 = document.createElement("span");
  span32.innerHTML = "image"
  span32.className = "material-symbols-outlined";

  //APPEND
  button1.appendChild(span1);
  button2.appendChild(span2);
  div1.appendChild(imginput);
  div1.appendChild(button1);
  div1.appendChild(button2);

  button21.appendChild(span21);
  button22.appendChild(span22);
  div2.appendChild(imginput2);
  div2.appendChild(button21);
  div2.appendChild(button22);

  button31.appendChild(span31);
  button32.appendChild(span32);
  div3.appendChild(imginput3);
  div3.appendChild(button31);
  div3.appendChild(button32);

  page.appendChild(div1);
  page.appendChild(div2);
  page.appendChild(div3);


  reapplyButtonListeners(page);


}

function constructForm2(page){
  page.innerHTML = ""
  const div1 = document.createElement("div");
  div1.className = "cell-2-1";
  div1.id = page.id+"_1";

  const div2 = document.createElement("div");
  div2.className = "cell-2-2";
  div2.id = page.id+"_2";

  const div3 = document.createElement("div");
  div3.className = "cell-2-3";
  div3.id = page.id+"_3";

  const div4 = document.createElement("div");
  div4.className = "cell-2-4";
  div4.id = page.id+"_4";

  const imginput = document.createElement("input");
  imginput.type = "file";
  imginput.style ="display: none;"
  imginput.id = "image-input";

  const button1 = document.createElement("button");
  button1.className = "text-button";
  button1.title = "Text";

  const button2 = document.createElement("button");
  button2.className = "img-button";
  button2.id = "img-button";
  button2.title = "Image";

  // span
  const span1 = document.createElement("span");
  span1.innerHTML = "text_fields"
  span1.className = "material-symbols-outlined";

  const span2 = document.createElement("span");
  span2.innerHTML = "image"
  span2.className = "material-symbols-outlined";

  const imginput2 = document.createElement("input");
  imginput2.type = "file";
  imginput2.style ="display: none;"
  imginput2.id = "image-input2";

  const button21 = document.createElement("button");
  button21.className = "text-button";
  button21.title = "Text";

  const button22 = document.createElement("button");
  button22.className = "img-button";
  button22.id = "img-button";
  button22.title = "Image";

  // span
  const span21 = document.createElement("span");
  span21.innerHTML = "text_fields"
  span21.className = "material-symbols-outlined";

  const span22 = document.createElement("span");
  span22.innerHTML = "image"
  span22.className = "material-symbols-outlined";

  const imginput3 = document.createElement("input");
  imginput3.type = "file";
  imginput3.style ="display: none;"
  imginput3.id = "image-input3";

  const button31 = document.createElement("button");
  button31.className = "text-button";
  button31.title = "Text";

  const button32 = document.createElement("button");
  button32.className = "img-button";
  button32.id = "img-button";
  button32.title = "Image";

  // span
  const span31 = document.createElement("span");
  span31.innerHTML = "text_fields"
  span31.className = "material-symbols-outlined";

  const span32 = document.createElement("span");
  span32.innerHTML = "image"
  span32.className = "material-symbols-outlined";

  const imginput4 = document.createElement("input");
  imginput4.type = "file";
  imginput4.style ="display: none;"
  imginput4.id = "image-input4";

  const button41 = document.createElement("button");
  button41.className = "text-button";
  button41.title = "Text";

  const button42 = document.createElement("button");
  button42.className = "img-button";
  button42.id = "img-button";
  button42.title = "Image";

  // span
  const span41 = document.createElement("span");
  span41.innerHTML = "text_fields"
  span41.className = "material-symbols-outlined";

  const span42 = document.createElement("span");
  span42.innerHTML = "image"
  span42.className = "material-symbols-outlined";


  button1.appendChild(span1);
  button2.appendChild(span2);
  div1.appendChild(imginput);
  div1.appendChild(button1);
  div1.appendChild(button2);

  button21.appendChild(span21);
  button22.appendChild(span22);
  div2.appendChild(imginput2);
  div2.appendChild(button21);
  div2.appendChild(button22);

  button31.appendChild(span31);
  button32.appendChild(span32);
  div3.appendChild(imginput3);
  div3.appendChild(button31);
  div3.appendChild(button32);

  button41.appendChild(span41);
  button42.appendChild(span42);
  div4.appendChild(imginput4);
  div4.appendChild(button41);
  div4.appendChild(button42);

  page.appendChild(div1);
  page.appendChild(div2);
  page.appendChild(div3);
  page.appendChild(div4);

  reapplyButtonListeners(page);

}

function constructForm3(page){
  page.innerHTML = ""
  const div1 = document.createElement("div");
  div1.className = "cell-3-1";
  div1.id = page.id+"_1";

  const div2 = document.createElement("div");
  div2.className = "cell-3-2";
  div2.id = page.id+"_2";

  const div3 = document.createElement("div");
  div3.className = "cell-3-3";
  div3.id = page.id+"_3";

  const div4 = document.createElement("div");
  div4.className = "cell-3-4";
  div4.id = page.id+"_4";

  const imginput = document.createElement("input");
  imginput.type = "file";
  imginput.style ="display: none;"
  imginput.id = "image-input";

  const button1 = document.createElement("button");
  button1.className = "text-button";
  button1.title = "Text";

  const button2 = document.createElement("button");
  button2.className = "img-button";
  button2.id = "img-button";
  button2.title = "Image";

  // span
  const span1 = document.createElement("span");
  span1.innerHTML = "text_fields"
  span1.className = "material-symbols-outlined";

  const span2 = document.createElement("span");
  span2.innerHTML = "image"
  span2.className = "material-symbols-outlined";

  const imginput2 = document.createElement("input");
  imginput2.type = "file";
  imginput2.style ="display: none;"
  imginput2.id = "image-input2";

  const button21 = document.createElement("button");
  button21.className = "text-button";
  button21.title = "Text";

  const button22 = document.createElement("button");
  button22.className = "img-button";
  button22.id = "img-button";
  button22.title = "Image";

  // span
  const span21 = document.createElement("span");
  span21.innerHTML = "text_fields"
  span21.className = "material-symbols-outlined";

  const span22 = document.createElement("span");
  span22.innerHTML = "image"
  span22.className = "material-symbols-outlined";

  const imginput3 = document.createElement("input");
  imginput3.type = "file";
  imginput3.style ="display: none;"
  imginput3.id = "image-input3";

  const button31 = document.createElement("button");
  button31.className = "text-button";
  button31.title = "Text";

  const button32 = document.createElement("button");
  button32.className = "img-button";
  button32.id = "img-button";
  button32.title = "Image";

  // span
  const span31 = document.createElement("span");
  span31.innerHTML = "text_fields"
  span31.className = "material-symbols-outlined";

  const span32 = document.createElement("span");
  span32.innerHTML = "image"
  span32.className = "material-symbols-outlined";

  const imginput4 = document.createElement("input");
  imginput4.type = "file";
  imginput4.style ="display: none;"
  imginput4.id = "image-input4";

  const button41 = document.createElement("button");
  button41.className = "text-button";
  button41.title = "Text";

  const button42 = document.createElement("button");
  button42.className = "img-button";
  button42.id = "img-button";
  button42.title = "Image";

  // span
  const span41 = document.createElement("span");
  span41.innerHTML = "text_fields"
  span41.className = "material-symbols-outlined";

  const span42 = document.createElement("span");
  span42.innerHTML = "image"
  span42.className = "material-symbols-outlined";


  button1.appendChild(span1);
  button2.appendChild(span2);
  div1.appendChild(imginput);
  div1.appendChild(button1);
  div1.appendChild(button2);

  button21.appendChild(span21);
  button22.appendChild(span22);
  div2.appendChild(imginput2);
  div2.appendChild(button21);
  div2.appendChild(button22);

  button31.appendChild(span31);
  button32.appendChild(span32);
  div3.appendChild(imginput3);
  div3.appendChild(button31);
  div3.appendChild(button32);

  button41.appendChild(span41);
  button42.appendChild(span42);
  div4.appendChild(imginput4);
  div4.appendChild(button41);
  div4.appendChild(button42);

  page.appendChild(div1);
  page.appendChild(div2);
  page.appendChild(div3);
  page.appendChild(div4);

  reapplyButtonListeners(page);

}

function constructForm4(page){
  page.innerHTML = ""
  const div1 = document.createElement("div");
  div1.className = "cell-4-1";
  div1.id = page.id+"_1";

  const div2 = document.createElement("div");
  div2.className = "cell-4-2";
  div2.id = page.id+"_2";

  const div3 = document.createElement("div");
  div3.className = "cell-4-3";
  div3.id = page.id+"_3";

  const div4 = document.createElement("div");
  div4.className = "cell-4-4";
  div4.id = page.id+"_4";

  const imginput = document.createElement("input");
  imginput.type = "file";
  imginput.style ="display: none;"
  imginput.id = "image-input";

  const button1 = document.createElement("button");
  button1.className = "text-button";
  button1.title = "Text";

  const button2 = document.createElement("button");
  button2.className = "img-button";
  button2.id = "img-button";
  button2.title = "Image";

  // span
  const span1 = document.createElement("span");
  span1.innerHTML = "text_fields"
  span1.className = "material-symbols-outlined";

  const span2 = document.createElement("span");
  span2.innerHTML = "image"
  span2.className = "material-symbols-outlined";

  const imginput2 = document.createElement("input");
  imginput2.type = "file";
  imginput2.style ="display: none;"
  imginput2.id = "image-input2";

  const button21 = document.createElement("button");
  button21.className = "text-button";
  button21.title = "Text";

  const button22 = document.createElement("button");
  button22.className = "img-button";
  button22.id = "img-button";
  button22.title = "Image";

  // span
  const span21 = document.createElement("span");
  span21.innerHTML = "text_fields"
  span21.className = "material-symbols-outlined";

  const span22 = document.createElement("span");
  span22.innerHTML = "image"
  span22.className = "material-symbols-outlined";

  const imginput3 = document.createElement("input");
  imginput3.type = "file";
  imginput3.style ="display: none;"
  imginput3.id = "image-input3";

  const button31 = document.createElement("button");
  button31.className = "text-button";
  button31.title = "Text";

  const button32 = document.createElement("button");
  button32.className = "img-button";
  button32.id = "img-button";
  button32.title = "Image";

  // span
  const span31 = document.createElement("span");
  span31.innerHTML = "text_fields"
  span31.className = "material-symbols-outlined";

  const span32 = document.createElement("span");
  span32.innerHTML = "image"
  span32.className = "material-symbols-outlined";

  const imginput4 = document.createElement("input");
  imginput4.type = "file";
  imginput4.style ="display: none;"
  imginput4.id = "image-input4";

  const button41 = document.createElement("button");
  button41.className = "text-button";
  button41.title = "Text";

  const button42 = document.createElement("button");
  button42.className = "img-button";
  button42.id = "img-button";
  button42.title = "Image";

  // span
  const span41 = document.createElement("span");
  span41.innerHTML = "text_fields"
  span41.className = "material-symbols-outlined";

  const span42 = document.createElement("span");
  span42.innerHTML = "image"
  span42.className = "material-symbols-outlined";


  button1.appendChild(span1);
  button2.appendChild(span2);
  div1.appendChild(imginput);
  div1.appendChild(button1);
  div1.appendChild(button2);

  button21.appendChild(span21);
  button22.appendChild(span22);
  div2.appendChild(imginput2);
  div2.appendChild(button21);
  div2.appendChild(button22);

  button31.appendChild(span31);
  button32.appendChild(span32);
  div3.appendChild(imginput3);
  div3.appendChild(button31);
  div3.appendChild(button32);

  button41.appendChild(span41);
  button42.appendChild(span42);
  div4.appendChild(imginput4);
  div4.appendChild(button41);
  div4.appendChild(button42);

  page.appendChild(div1);
  page.appendChild(div2);
  page.appendChild(div3);
  page.appendChild(div4);

  reapplyButtonListeners(page);

}

function constructForm5(page){
  page.innerHTML = ""
  const div1 = document.createElement("div");
  div1.className = "cell-5-1";
  div1.id = page.id+"_1";

  const div2 = document.createElement("div");
  div2.className = "cell-5-2";
  div2.id = page.id+"_2";

  const div3 = document.createElement("div");
  div3.className = "cell-5-3";
  div3.id = page.id+"_3";

  const div4 = document.createElement("div");
  div4.className = "cell-5-4";
  div4.id = page.id+"_4";

  const imginput = document.createElement("input");
  imginput.type = "file";
  imginput.style ="display: none;"
  imginput.id = "image-input";

  const button1 = document.createElement("button");
  button1.className = "text-button";
  button1.title = "Text";

  const button2 = document.createElement("button");
  button2.className = "img-button";
  button2.id = "img-button";
  button2.title = "Image";

  // span
  const span1 = document.createElement("span");
  span1.innerHTML = "text_fields"
  span1.className = "material-symbols-outlined";

  const span2 = document.createElement("span");
  span2.innerHTML = "image"
  span2.className = "material-symbols-outlined";

  const imginput2 = document.createElement("input");
  imginput2.type = "file";
  imginput2.style ="display: none;"
  imginput2.id = "image-input2";

  const button21 = document.createElement("button");
  button21.className = "text-button";
  button21.title = "Text";

  const button22 = document.createElement("button");
  button22.className = "img-button";
  button22.id = "img-button";
  button22.title = "Image";

  // span
  const span21 = document.createElement("span");
  span21.innerHTML = "text_fields"
  span21.className = "material-symbols-outlined";

  const span22 = document.createElement("span");
  span22.innerHTML = "image"
  span22.className = "material-symbols-outlined";

  const imginput3 = document.createElement("input");
  imginput3.type = "file";
  imginput3.style ="display: none;"
  imginput3.id = "image-input3";

  const button31 = document.createElement("button");
  button31.className = "text-button";
  button31.title = "Text";

  const button32 = document.createElement("button");
  button32.className = "img-button";
  button32.id = "img-button";
  button32.title = "Image";

  // span
  const span31 = document.createElement("span");
  span31.innerHTML = "text_fields"
  span31.className = "material-symbols-outlined";

  const span32 = document.createElement("span");
  span32.innerHTML = "image"
  span32.className = "material-symbols-outlined";

  const imginput4 = document.createElement("input");
  imginput4.type = "file";
  imginput4.style ="display: none;"
  imginput4.id = "image-input4";

  const button41 = document.createElement("button");
  button41.className = "text-button";
  button41.title = "Text";

  const button42 = document.createElement("button");
  button42.className = "img-button";
  button42.id = "img-button";
  button42.title = "Image";

  // span
  const span41 = document.createElement("span");
  span41.innerHTML = "text_fields"
  span41.className = "material-symbols-outlined";

  const span42 = document.createElement("span");
  span42.innerHTML = "image"
  span42.className = "material-symbols-outlined";


  button1.appendChild(span1);
  button2.appendChild(span2);
  div1.appendChild(imginput);
  div1.appendChild(button1);
  div1.appendChild(button2);

  button21.appendChild(span21);
  button22.appendChild(span22);
  div2.appendChild(imginput2);
  div2.appendChild(button21);
  div2.appendChild(button22);

  button31.appendChild(span31);
  button32.appendChild(span32);
  div3.appendChild(imginput3);
  div3.appendChild(button31);
  div3.appendChild(button32);

  button41.appendChild(span41);
  button42.appendChild(span42);
  div4.appendChild(imginput4);
  div4.appendChild(button41);
  div4.appendChild(button42);

  page.appendChild(div1);
  page.appendChild(div2);
  page.appendChild(div3);
  page.appendChild(div4);

  reapplyButtonListeners(page);

}



export const loadProject = async function () {
  // console.log("hai")
  var project = sessionStorage.getItem("projectName");
  const allDocs = await getDocs(collection(db, project));
  // console.log("Total documents fetched:"+ allDocs.size);
  // allDocs.forEach((doc) => console.log(doc.id+ "   "+ doc.data().pageNumber));
  const pages = document.querySelectorAll("[class^=page-]");

  const allPageNums = [];

  allDocs.forEach((doc) => {
    if (doc.data().pageNumber !== undefined) {
      allPageNums.push(String(doc.data().pageNumber));
    }
  });

  // Ensure enough pages exist
  let pagesToAdd = Math.max(0, Math.ceil((allPageNums.length - pages.length) / 2));
  for (let i = 0; i < pagesToAdd; i++) {
    addPages();
    // console.log("pages added")
  }

  // Assign content and ensure page numbers
  allDocs.forEach((doc) => {
    // console.log(doc.data().pageNumber)
    if (doc.data().pageNumber !== undefined) {
      var page = document.getElementById(String(doc.data().pageNumber));
      console.log(`current page: ${page.id}`)
      if (!page) {
        console.warn(`Page ${doc.data().pageNumber} not found.`);
        return;
      }

      page.className = doc.data().format;
      console.log(`current format: ${page.className}`)
    //page.innerHTML=""; 
      if(page.className == "page-0"){
        constructForm0(page);
      }else if(page.className == "page-1"){
        constructForm1(page)
      }else if(page.className == "page-2") {
        constructForm2(page)
      }else if(page.className == "page-3") {
        constructForm3(page)
      }else if(page.className == "page-4") {
        constructForm4(page)
      }else if(page.className == "page-5") {
        constructForm5(page)
      }

      var content = doc.data().content;
      var children = page.children;
      if(content != undefined){
        for (let i = 0; i < ((content.length)); i++) {
          // console.log(content[i]);
            //if its text, set the right content and make it editable
          if(!content[i].startsWith("https") || (!children[i].querySelector("button"))){
            children[i].innerHTML = content[i];
            children[i].setAttribute("contenteditable", "true");
            // children[i].setAttribute('contenteditable', 'false');
          }
          else{
              //if its an image, recreate the correct image content
            // console.log(page.id);
            const newImg = document.createElement("img");
            newImg.id = "image";
            newImg.src = content[i];
            newImg.alt = content[i];
            children[i].innerHTML = ""
            // console.log(children[i].className);
            children[i].appendChild(newImg);
              createImageDelete(children[i]);
          }
        }
      }
      reapplyButtonListeners(page);
      makePageNums(page);
    }
  });

  //make sure every page has a page number
  document.querySelectorAll("[class^=page-]").forEach((page) => {
    makePageNums(page);
  });
}


async function makePageNums(page) {
  const r = query(
    collection(db, sessionStorage.getItem("projectName")),
    where("pageNumber", "==", String(page.id)) // Ensure comparison works
  );
  const querySnapshot = await getDocs(r);
  // Prevent duplicate page numbers
  if (!page.querySelector(".pageNum")) {
    querySnapshot.forEach((doc) => {
      const pageNum = document.createElement("p");
      pageNum.className = "pageNum";
      pageNum.innerHTML = doc.data().pageNumber;
      page.appendChild(pageNum);
    });
  }
}

function makeEditable(element) {
  element.setAttribute("contenteditable", "true");
  element.setAttribute("placeholder", "Add Text...");
  element.classList.add("text-box");
}


function reapplyButtonListeners(page) {
  // Reattach text button events
  page.querySelectorAll(".text-button").forEach((button) => {
    button.onclick = function () {
      const textBox = button.parentNode;
      makeEditable(textBox); // Ensure the text area is editable
      textBox.innerHTML = ""; // Clear previous content
    };
  });

  // Reattach image button events
  page.querySelectorAll(".img-button").forEach((button, index) => {
    const inputId = `image-input-${page.id}-${index}`;
    let imgInput = page.querySelector(`#${inputId}`);

    // Create image input if it doesn't exist
    if (!imgInput) {
      imgInput = document.createElement("input");
      imgInput.type = "file";
      imgInput.style.display = "none";
      imgInput.id = inputId;
      button.parentNode.appendChild(imgInput);
    }

    // Handle image click event
    button.onclick = function () {
      imgInput.click();
    };

    // Handle image selection and display
    imgInput.onchange = function () {
      var selectedFile = this.files[0];
      if (selectedFile) {
        // var reader = new FileReader();
        // reader.onload = function (event) {
          var imageContainer = button.parentNode;
          imageContainer.innerHTML = ""; // Clear content
          

          // var img = document.createElement("img");
          // img.id = "image";
          // img.src = event.target.result;
            //store the image uploaded with fileReader
          storeFile(selectedFile, imageContainer);
            //call function to create image delete buttons
          createImageDelete(imageContainer);
        // };
      } else {
        alert("Please select an image first.");
      }
    };
  });
}

//create an image delete button with proper style  connected to the image div
function createImageDelete(container){
  container.style.display = "flex";
  container.style.justifyContent = "center";
  container.style.alignItems = "center";
  var imgDelete = document.createElement("button");
  var imgDeleteSpan = document.createElement("span");
  imgDeleteSpan.innerHTML = "delete";
  imgDeleteSpan.className = "material-symbols-outlined";
  imgDelete.id = "imageDelete";
  imgDelete.style.visibility = "hidden";

  imgDelete.onclick = function () {
    console.log("being clicked");
    handleImageDelete(container, container.parentNode);
  };

  imgDelete.appendChild(imgDeleteSpan);
  container.appendChild(imgDelete);

  container.addEventListener("mouseover", function () {
    imgDelete.style.visibility = "visible";
  });

  container.addEventListener("mouseout", function () {
    imgDelete.style.visibility = "hidden";
  });
}

//image delete button function
//sets innerHTML to "" and remakes text and image buttons
function handleImageDelete(imageContainer, page) {
  imageContainer.innerHTML = "";
  imageContainer.style.display = "block";

  var imageList = JSON.parse(sessionStorage.getItem("imageStorage"));

  imageList.forEach((item) => {
    console.log("container id: "+imageContainer.id);
    console.log("location: "+item.location);
    console.log("file name: "+item.fileName);
    if (item.location == imageContainer.id){
      //create cloud storage references for page, div, and image according to their ids in javascript
      const imagesRef = ref(storage, sessionStorage.getItem("projectName"));
      const pageRef = ref(imagesRef, imageContainer.parentNode.id);
      const divRef = ref(pageRef, imageContainer.className);
      const storageRef = ref(divRef, item.fileName);

      deleteObject(storageRef).then(() => {
        console.log("deleted image "+item.url+ " from storage");
      }).catch((error) => {
        console.warn("Unable to delete file: "+error)
      });


      let elementToRemove = item;
      let index = imageList.indexOf(elementToRemove);
      if (index > -1) { // Check if the element exists in the array
       imageList.splice(index, 1);
       console.log("deleted image "+item.url+ " from imagesList");
       sessionStorage.setItem("imageStorage", JSON.stringify(imageList));
      }
    }
  });

  const imginput = document.createElement("input");
  imginput.type = "file";
  imginput.style.display = "none";
  imginput.id = "image-input";

  const button1 = document.createElement("button");
  button1.className = "text-button";
  button1.title = "Text";

  const button2 = document.createElement("button");
  button2.className = "img-button";
  button2.id = "img-button";
  button2.title = "Image";

  const span1 = document.createElement("span");
  span1.innerHTML = "text_fields";
  span1.className = "material-symbols-outlined";

  const span2 = document.createElement("span");
  span2.innerHTML = "image";
  span2.className = "material-symbols-outlined";

  button1.appendChild(span1);
  button2.appendChild(span2);
  imageContainer.appendChild(button1);
  imageContainer.appendChild(button2);
  imageContainer.appendChild(imginput);

  reapplyButtonListeners(page);
}


document.addEventListener('keydown', ({key}) => {
  const activeDiv = document.activeElement.closest('[contenteditable]');
//  console.log("active page: " + activeDiv.id);
  var page = activeDiv.parentNode;
  if (!activeDiv) return;
  if ((key === "Backspace" || key === "Delete")&&(activeDiv.textContent.trim().length == 0)) {
    activeDiv.innerHTML = "";
    activeDiv.setAttribute("contenteditable", "false");
    activeDiv.classList.remove("text-box");
      const imginput = document.createElement("input");
      imginput.type = "file";
      imginput.style ="display: none;"
      imginput.id = "image-input";

      const button1 = document.createElement("button");
      button1.className = "text-button";
      button1.title = "Text";

      const button2 = document.createElement("button");
      button2.className = "img-button";
      button2.id = "img-button";
      button2.title = "Image";

      const span1 = document.createElement("span");
      span1.innerHTML = "text_fields"
      span1.className = "material-symbols-outlined";

      const span2 = document.createElement("span");
      span2.innerHTML = "image"
      span2.className = "material-symbols-outlined";

    button1.appendChild(span1);
    button2.appendChild(span2);
    activeDiv.appendChild(button1);
    activeDiv.appendChild(button2);
    activeDiv.appendChild(imginput);

    reapplyButtonListeners(page);  
    
  }
});

export const makeNewPageDocs = async function (){
  //get all documents in the project
  var project = sessionStorage.getItem('projectName'); 
  var allDocs = await getDocs(collection(db, project));
  
  //create an empty list
  //all documents in firebase that have an attr. of pagenumber will have that value added to this list
  const allPageNums = []
      //for each document in firebase associated with "project"
      allDocs.forEach((item) => {
          //if the document has an attr. page number
          if (item.data().pageNumber != undefined){
            //add that value to allPageNums
              allPageNums.push(String(item.data().pageNumber))
          }
      })

  
  //get a list of all elements whose class starts with "page-"
  //all page class names will be formatted as: page-format# (ex. page-1)
  const allPages = document.querySelectorAll("[class^=page-]")

  //for every page element in allPages
  for (let i = 0; i < allPages.length; i++) {
      //if allPageNums (a list of page numbers found in firebase) does not have a page with the page number, add a document to firebase
      //this adds all new pages that have been created to firebase
      if (!(allPageNums.includes(allPages[i].id))){
          //add document with the correct pagenumber 
          console.log("making new docs in firebase cuz i found pages that don't exist there");
          await addDoc(collection(db, project),{
              pageNumber: allPages[i].id
          });
      }
  }
  
  saveProject();
}


//save document
export const saveProject =  async function(){
  //get the name of project user is currently loaded into. 
  //Set by the main menu
  var project = sessionStorage.getItem('projectName'); 
  
  //get all documents in the project
  var allDocs = await getDocs(collection(db, project));
  
  //create an empty list
  //all documents in firebase that have an attr. of pagenumber will have that value added to this list
  const allPageNums = []
      //for each document in firebase associated with "project"
      allDocs.forEach((item) => {
          //if the document has an attr. page number
          if (item.data().pageNumber != undefined ){
            //add that value to allPageNums
              allPageNums.push(String(item.data().pageNumber))
          }
      })

  
  //get a list of all elements whose class starts with "page-"
  //all page class names will be formatted as: page-format# (ex. page-1)
  const allPages = document.querySelectorAll("[class^=page-]")


  

  //get all documents in the project
  //(this must be called again because pages may have been added that did not exist when "phoogdocs" was originally declared
  allDocs = await getDocs(collection(db, project));
  
  //for each document in project
  allDocs.forEach((item) => {
      //if the document has pageNumber attr.
      if(item.data().pageNumber != null) {

        //pull page element with the same page number as doc
        var page = document.getElementById(item.data().pageNumber);
        // console.log(page.id)

        //define item to update
        const updateItem = doc(db, project, item.id);
        
        //get format (class name is format)
        var format_name = page.className;
        
        //update format
        updateDoc(updateItem, {
          format: format_name
        });

        // console.log(format_name)
        //make list of all child elements of page ^^^^
        var children = page.children;


        
        //list of all child element content
        var content = []

        //loop through children
        for(let i = 0; i < children.length; i++){
          if(children[i].className != "pageNum"){
            //if innerhtml of given child element is not undefined and is not an image, add its content to content list
            if ((children[i].innerHTML != undefined)&& (!children[i].querySelector("img"))){
              //add content to content list
              content.push(children[i].innerHTML);
            }  
              //if given child element is an image and is already in the firebase storage,
              //save it to the new content so it stays there when the content is overwritten
            else if(children[i].querySelector("img")&&(children[i].children[0].src!=undefined)){
              console.log(children[i].children[0].src);
              // console.log(doc.data().content[i]);
              console.log("image already exists here!");
              content.push(children[i].children[0].src);
            }
                //if the given child element is a new image add it to the new content
            else{
              console.log("found img");
                //retrieve the list of image objects from session storage
              const listOfImages = JSON.parse(sessionStorage.getItem("imageStorage"));
              console.log(listOfImages);
              listOfImages.forEach((image) => { 
                // console.log("loop");
                console.log(image.location);
                console.log(children[i].id);
                  //if an image's registered location is the same as the current child element (the div),
                  //splice it into the correct section of new content
                if(image.location == children[i].id){
                  // console.log("true");
                  const id = image.location;
                  const lastDashIndex = id.lastIndexOf("_");
                  const lastNumber = id.substring(lastDashIndex + 1);
                  console.log("splicing Url: "+image.url)
                  content.splice(lastNumber, 0, image.url);
                }
              });
            }
          }
        }

        // console.log(content)
        //update content attr with content list
        updateDoc(updateItem, {
          content: content
        });
      }
  })

}
  
  //function choose format to bring up the popup format selector
  export const chooseFormat = function(pageNumber){
      //saving the requested page to change
    sessionStorage.setItem('pageNumber', pageNumber);
    var popup = document.getElementById("myPopup");
      //format picker popup shown
    popup.classList.add("show");
    var popup = document.getElementById("contentContainer");
    popup.classList.add("color");
  }
  //function to close the popup after the format is chosen
  export const closeFormatPopup = function(){
    var popup = document.getElementById("myPopup");
      //popup hidden
    popup.classList.remove("show");
    var popup = document.getElementById("contentContainer");
    popup.classList.remove("color");
  }


//scroll to the second to last page
export const scrollBottom = function() {
  //get pages
  const pages = document.getElementsByClassName("page-0");
  //log second to last page
  // console.log(pages[pages.length - 2].id)
  //scroll page into view
  pages[pages.length - 2].scrollIntoView();
  }

  if (window.location.pathname.includes("editor.html")) {
    window.addEventListener('beforeunload', function (e) {
      e.returnValue = 'Are you sure you want to leave?';
    });
  }


export const changeFormat = function(format){
  console.log(`format: ${format}`)
  
  var pageNumber = sessionStorage.getItem('pageNumber'); 
  var page = document.getElementById(pageNumber);

  console.log(`page Num: ${page.id}`)
  page.className = format;
  if(page.className == "page-0"){
    constructForm0(page)
  }else if(page.className == "page-1"){
    constructForm1(page)
  }else if(page.className == "page-2") {
    constructForm2(page)
  }else if(page.className == "page-3") {
    constructForm3(page)
  }else if(page.className == "page-4") {
    constructForm4(page)
  }else if(page.className == "page-5") {
    constructForm5(page)
  }else if(page.className == "page-6") {
    constructForm6(page)
  }
}

export const setProjectName = function(){
  var projectName = document.getElementById("project-title");
  let project = sessionStorage.getItem("projectName");
  let projectNameAdjust = project.split("§");
  // console.log(project);
  projectName.innerHTML = projectNameAdjust[0];
}

export const printProject = () => {
  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;

  // Copy the editor content (assuming it has an ID of "CONTAINER")
  const editorContent = document.getElementById('container').cloneNode(true);

  const styles = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules).map(rule => rule.cssText).join("\n");
      } catch (e) {
        return ""; // Some stylesheets may be restricted due to CORS
      }
    })
    .join("\n");
  
   // Write the copied content into the iframe
  frameDoc.open();
  frameDoc.write(`
    <html>
      <head>
        <title>Print</title>
        <style>${styles}</style>
      </head>
      <body></body>
    </html>
`);
  frameDoc.close();

  setTimeout(() => {
    frameDoc.body.appendChild(editorContent);

    // Ensure content is rendered before printing
    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      document.body.removeChild(printFrame); // Clean up
    }, 500);
  }, 100);
};


export const deletePages =  async function(section_num){
  console.log("deleting");
  //get the name of project user is currently loaded into. 
  //Set by the main menu
  var project = sessionStorage.getItem('projectName'); 
  


  let page_num1 = (section_num * 2) - 1
  let page_num2 = (section_num * 2)
  // console.log("?")
  // console.log(page_num1)
  // console.log(page_num2)

  let section = ("container-" + String(section_num));
  // console.log(section)

  var pages = document.getElementById(section);
  // console.log(pages)

  pages.remove();
  console.log("before deleteDoc for pages");

  var q = query(collection(db, project), where("pageNumber", "==", String(page_num1)));
  var page = await getDocs(q);
  for (const document of page.docs) {
    try {
      // Delete the document from the specific project collection
      await deleteDoc(doc(db, project, document.id));
      console.log(`Document with Page Number: ${document.data().pageNumber} deleted from collection ${project}`);
    } catch (error) {
      console.error("Error deleting document:"+ error);
    }
  }
  

  q = query(collection(db, project), where("pageNumber", "==", String(page_num2)));
  var page = await getDocs(q);
  for (const document of page.docs) {
    try {
      // Delete the document from the specific project collection
      await deleteDoc(doc(db, project, document.id));
      console.log(`Document with Page Number: ${document.data().pageNumber} deleted from collection ${project}`);
    } catch (error) {
      console.error("Error deleting document:"+ error);
    }
  }


   //REORDER PAGE NUMBERS
   const s = query(collection(db, project), where("pageNumber", "!=", "undefined"));
   //docs from query
   const allDocs = await getDocs(s);
 
   allDocs.forEach((item)=>{
     var num = Number(item.data().pageNumber);
     if(num>page_num2){
       var newNum = num-2;
 
       var updateItem = doc(db, project, item.id);
       updateDoc(updateItem, {
         pageNumber: String(newNum)
       });
       console.log("updated firebase with page number: "+newNum);
     }
   });
  //  document.querySelectorAll("[class^=page-]").forEach((page) => {
  //   makePageNums(page);
  // });
}

//changes the font size based on param size
//size: an integer for font size (in px)
export const fontSize =  function(size){

  // Gets currently highlighted text by user ("selection")
  var sel = document.getSelection(); 

  //initialize selectedHTML variable
  var selectedHtml = "";

  //selection more than nothing
  //.rangeCount returns an amount of ranges in an object
  if (sel.rangeCount) {

    //create a container element
      var container = document.createElement("div");

      for (var i = 0, len = sel.rangeCount; i < len; ++i) {
            //add each range from user selection to container ^^^
          container.appendChild(sel.getRangeAt(i).cloneContents());
      }

      const children = container.getElementsByTagName("*")
      
      for(let child of children) {
          if(child.style.fontSize) {
              child.style.fontSize = `${size}px`
          }
      }
      selectedHtml = container.innerHTML;
  }

  let html = `<div style="font-size: ${size}px;">${selectedHtml}</div>`
  document.execCommand('insertHTML', false, html);
}



//essentially the same as addPages
//adds pages but with minimal buttons for the print preview page
export const addPagesPrint = function(){
   
  //create elements

  //page-container
  const pagesContainer = document.createElement("div");
  pagesContainer.className = "pages-container-print";

  //editors
  const editor1 = document.createElement("div");
  editor1.className = "editor";

  const editor2 = document.createElement("div");
  editor2.className = "editor";

  //pages

    //amount of pages
  const pages = document.querySelectorAll("[class^=page-]")

  const page1 = document.createElement("div");
  page1.className = "page-0";

  const page2 = document.createElement("div");
  page2.className = "page-0";


      //pages and tools to editor
  editor1.appendChild(page1);

  editor2.appendChild(page2);

      //editors to pages-container
  pagesContainer.appendChild(editor1);
  pagesContainer.appendChild(editor2);

      //pages-container to container
  document.getElementById("container").appendChild(pagesContainer);


}

//essentially the same as loadProject with minor differences

export const loadProjectPrint = async function () {
  // console.log("hai")
  var project = sessionStorage.getItem("projectName");
  const allDocs = await getDocs(collection(db, project));
  // console.log("Total documents fetched:"+ allDocs.size);
  // allDocs.forEach((doc) => console.log(doc.id+ "   "+ doc.data().pageNumber));
  var pages = document.querySelectorAll("[class^=page-]");

  const allPageNums = [];

  allDocs.forEach((doc) => {
    if (doc.data().pageNumber !== undefined) {
      allPageNums.push(String(doc.data().pageNumber));
    }
  });

  // Ensure enough pages exist
  for (let i = 0; i < (allPageNums.length - pages.length)/2; i++) {
    addPagesPrint()
  }

  //get a list of all elements whose class starts with "page-"
  //all page class names will be formatted as: page-format# (ex. page-1)
  pages = document.querySelectorAll("[class^=page-]")
  if (pages.length%4 != 0) {
    addPagesPrint()
  }

  pages = document.querySelectorAll("[class^=page-]")

  pages[0].id = "front"
  pages[1].id = "back"
  console.log("number of pages: " + pages.length);
  for (let i = 2; i <= (pages.length-2) ; i+=2) { 
    console.log("Giving ids to the " + i + "th and " + (i+1)+ "th page ");
    pages[i].id = i-1;
    pages[i+1].id=pages.length-(i);
    
    if (pages[i].id%2 == 0) {
          const temp = pages[i].id
          pages[i].id = pages[i+1].id
          pages[i+1].id = temp
          console.log("temp: " + temp);
    }
    console.log(pages[i].id);
    console.log(pages[i+1].id);
  
  }

  

  // Assign content and ensure page numbers
  allDocs.forEach((doc) => {
    // console.log(doc.data().pageNumber)
    if (doc.data().pageNumber !== undefined) {
      var page = document.getElementById(String(doc.data().pageNumber));
      // console.log(`PRINT current page: ${page.id}`)

      if (!page) {
        console.warn(`Page ${doc.data().pageNumber} not found.`);
        return;
      }

      page.className = doc.data().format;
      // console.log(`PRINT current format: ${page.className}`)
      
      // page.innerHTML = `page num: ${page.id}| format: ${page.className}`
    // //page.innerHTML=""; 
      if(page.className == "page-0"){
        constructForm0(page);
      }else if(page.className == "page-1"){
        constructForm1(page)
      }else if(page.className == "page-2") {
        constructForm2(page)
      }else if(page.className == "page-3") {
        constructForm3(page)
      }else if(page.className == "page-4") {
        constructForm4(page)
      }else if(page.className == "page-5") {
        constructForm5(page)
      }

      
      var content = doc.data().content;
      var children = page.children;

      for (let i = 0; i < ((content.length)); i++) {
          //if its text, set the right content and make it editable
        if(!content[i].startsWith("https") || (!children[i].querySelector("button"))){
          children[i].innerHTML = content[i];
          // children[i].setAttribute('contenteditable', 'false');
        }
        else{
            //if its an image, recreate the correct image content
          // console.log(page.id);
          const newImg = document.createElement("img");
          newImg.id = "image";
          newImg.src = content[i];
          newImg.alt = content[i];
          children[i].innerHTML = ""
          // console.log(children[i].className);
          children[i].appendChild(newImg);
            // createImageDelete(children[i]);
        }
      }

    }
  });

  document.querySelectorAll("[class^=page-]").forEach((page) => {
    if(page.id !== "front" && page.id !== "back")
    makePageNums(page);
  });
}

