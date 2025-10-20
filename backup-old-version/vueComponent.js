<script>
  import { createApp } from 'vue/dist/vue.esm-bundler.js';
  var serviceBell = new Audio('./ServiceGlocke.wav');
  const picture_click = createApp({
    el:"#picture_click",
    data() {
      auswahl:"Nichts Ausgewählt"
      nachricht:""
      variableToPass: showMenu
      return {
        width: 10,
        height: 10,
        padding: 10,
        waittime: 1000
      }
    },
    computed: {
      computedElement(){
        return this.selectedElement;
      },
      computedMenu:{
        get(){
          return this.showMenu;
        },
        set(newMenu){
          this.showMenu = newMenu;
        }
      }
    },
    methods: {
      colorElement(){
        let wantElement = document.getElementById("SOS");
        wantElement.style.backgroundColor = "#D2691E";
      },
      playBell(){
        serviceBell.play();
      },
      stopBell(){
        serviceBell.pause();
      },
      cngAusw(text){
        let ausgabe = document.getElementById("Auswahl");
        ausgabe.innerHTML = text;
      },
      addChar(character){
        let nachricht = document.getElementById("msg");
        nachricht.value += character;
      },
      delChar(){
        let nachricht = document.getElementById("msg");
        nachricht.value = nachricht.value.slice(0, -1);
      },
      delallChar(){
        let nachricht = document.getElementById("msg");
        nachricht.value = "";
      },
      dayNight(){
        var element = document.body;
        element.classList.toggle("dark");
      },
      colorElement(elementID,menuValue){
        this.selectedElement = elementID;
        let elementToColour = document.getElementById(elementID);
        if((elementToColour) && (this.showMenu == menuValue)){
          elementToColour.style.filter= 'invert(47%) sepia(79%) saturate(525%) hue-rotate(342deg) brightness(88%) contrast(96%)';
        }
      },
      blancElement(elementID, menuValue){
        let elementToBlanc = document.getElementById(elementID);
        if((elementToBlanc) && (this.showMenu == menuValue)){
          elementToBlanc.style.filter= 'none';
        }
      },
      colormain(){
        setTimeout(() => {
          if(this.showMenu== 0){
            this.blancElement("EIN",0);
            this.colorElement("SOS",0);
            setTimeout(() => {
              if(this.showMenu== 0){
                this.blancElement("SOS",0);
                this.colorElement("AUA",0);
                setTimeout(()=>{
                  if(this.showMenu== 0){
                    this.blancElement("AUA",0);
                    this.colorElement("NAC",0);
                    setTimeout(() =>{
                      if(this.showMenu== 0){
                        this.blancElement("NAC",0);
                        this.colorElement("HYG",0);
                        setTimeout(() =>{
                          if(this.showMenu== 0){
                            this.blancElement("HYG",0);
                            this.colorElement("EIN",0); 
                            setTimeout(()=>{
                              if(this.showMenu==0){
                                this.blancElement("EIN",0);
                                this.colormain();
                              }
                            },(this.waittime)); //warte vom einfärben von SOS
                          }
                        },(this.waittime)); //warte vom einfärben von EIN
                      }
                    },(this.waittime)); //warte vom einfärben von HYG 
                  }
                },(this.waittime));//warte vom einfärben von NAC
              }
            }, (this.waittime));//warte vom einfärben von AUA
          }
        }); //kein warten vor dem SOS-Element 
      } 
    },
    watch:{
      showMenu(){
        if(this.showMenu == 0){
          this.colormain();
        }
      }
    }
  }).mount('#picture_click');
</script>