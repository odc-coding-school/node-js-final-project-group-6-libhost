// 


$(document).ready(function(){
   
    $('a#link').mousemove(function(){
       
        $(this).css("background-color","gold");
        $(this).css("border-radius","5px");
    });
});


// 

$(document).ready(function(){
    
    $('input#search').hover(function(){
        
        $(this).css("background-color","white");
    })
})


//

$(document).ready(function(){
   
    $('a#link').mouseleave(function(){

        $(this).css("background-color","white");
    });
    
});


// 


$(document).ready(function(){
    
    $('card.card1').hover(function(){
        
        $('.desc').fadeIn();
    });
});


// 


$(document).ready(function(){
    
    $('#readmore').click(function(){

        $('.parag').toggle();
    });
});


//


$(document).ready(function(){
   
    $('input').mouseenter(function(){
       
        $(this).css("background-color","white");
        
    });
});


//


$(document).ready(function(){
   
    $('input').mouseover(function(){
       
        $(this).css("border","1px solid orange");
    });
    
});


//


$(document).ready( function(){
    
    $('input').mouseout(function(){
        
        $(this).css("background-color","white");
        $(this).css("border","1px solid orange");
    });
});


//


$(document).ready(function(){
   
    $('.btn btn-outline').click(function(){
       
        $(this).css("background-color","gold");
    
    });
});