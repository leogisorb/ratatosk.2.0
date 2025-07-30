class oculiActio {
	constructor(frame_duration, fps, debug){
		this.frame_duration = frame_duration;
		this.fps = fps;
		this.closed_frames = -1;
		this.debug = debug;
		this.facefactor = 55;
	}

  	

    Action_registered(registeredElement){
    	//wenn ein bestimmter wert erreicht wurde, in dem die Augen geschlossen sind,
    	//if ((this.closed_frames/this.fps) >= this.frame_duration){
    	if (this.closed_frames >= this.frame_duration){
    		if(this.debug){
	    	console.log("got action at ", registeredElement);
			}
			menue = 1;

    		//picture_click.computedMenu = 1;
    		//console.log("menu changed to ", picture_click.computedMenu;
    		//document.getElementById(registeredElement).click();
    		// dann führe die click-funktion des ausgewähltenelementes mit der ID aus
    		//hier die Aktionen reintun, die dann passieren sollen? 
    		return menue;
    	}
    }

	
}