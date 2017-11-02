import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../services/user.service';


declare var jquery:any;
declare var $ :any;


@Component({
 selector: 'app-header',
 templateUrl: './header.component.html',
 styleUrls: ['./header.component.css']
})



export class HeaderComponent implements OnInit{

 atIndex: boolean = true;
 atTrack: boolean = false;
 atRegister: boolean = false;
 atLogin: boolean = false;
 atDash: boolean = false;
 navBox: HTMLElement;
 mobileNavOpen: boolean = false;

last_known_scroll_position:number = 0;
ticking:boolean = false;
navAffixed:boolean = true;

 constructor(private route: ActivatedRoute, private user: UserService, private router: Router){

	route.url.subscribe((r) => {
		console.log('Route subscribe in header Response');
		console.log(r);
		this.setHeaderState();

	   },(e) => {
			console.log('Route Subscribe in header ERR');
		console.log(e);

	   }, () =>{
		console.log('Route Subscribe in header complete');


         });

 }
 

 setHeaderState(){
 
 	 if(this.route.snapshot.url.length > 0){
	  
		if(this.route.snapshot.url[0].path === 'tracker'){
                   this.atTrack = true;
	
                }else{
                  this.atTrack = false;

                }

               	if(this.route.snapshot.url[0].path === 'dashboard'){
                   this.atDash = true;
	
                }else{
                  this.atDash = false;

                }
                if(this.route.snapshot.url[0].path === 'login'){
                   this.atLogin = true;

                }else{
                  this.atLogin = false;
		
                
                }

                if(this.route.snapshot.url[0].path === 'register'){
                   this.atRegister = true;

                }else{
                  this.atRegister = false;
		
                
                }
		 this.atIndex = false;
	}else{
          this.atIndex = true;
        }
}



ngOnInit(){


   this.navBox = document.getElementById('navBox');

  if(this.route.snapshot.url.length > 0){
     this.navBox.style.position = 'fixed';
      this.navAffixed = true;
    }else{
      this.navBox.style.position = 'relative';
      this.navAffixed = false;
    }
 var self = this;
 window.addEventListener('scroll', function(e) {

  self.last_known_scroll_position = window.scrollY;

  if (!self.ticking) {

    window.requestAnimationFrame(function() {
      self.adjustNavBox();
      self.ticking = false;
    });
     
    self.ticking = true;

  }
  
});

  $('[data-toggle="tooltip"]').tooltip();

}

devicesOn(){
    var devOn = false;
  for(var i=0; i<this.user.devices.length; i++){

      if(this.user.devices[i].watching){
        devOn = true;
      }
  }

    return devOn;
}

clearWatching(){
  for(var i=0; i<this.user.devices.length; i++){
	this.user.devices[i].watching = false;
       }
	this.router.navigate(['/dashboard']);
}

adjustNavBox() {
    console.log('AjustingNavBox...');

  // do something with the scroll position

  if(this.route.snapshot.url.length < 1 && this.last_known_scroll_position < 380){
     this.navBox.style.position = 'relative';
     this.navAffixed = false;
    }else{
      if(this.navBox.style.position === 'relative'){
        this.navBox.style.position = 'fixed';
         this.navAffixed = true;
      }
    }

}




onHamburgerClick(){

	this.mobileNavOpen ? this.mobileNavOpen = false : this.mobileNavOpen = true;

}



logout(){
 this.user.logout();

}

goTrack(){
 this.router.navigate(['/tracker']);
}





}