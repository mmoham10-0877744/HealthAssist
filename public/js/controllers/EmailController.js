var appControllers=angular.module('app.controllers');

appControllers.controller('EmailController',function(TagService,$scope,BookmarkService,Helpers,$stateParams,$state,$modal,CONSTANT,$http,focus,toaster){

    $scope.editBookmark={};         $scope.editTags=[];
    $scope.allTags=[];              $scope.editTagText={input:null};
    $scope.emailBookmarkMessage=null;

    BookmarkService.getBookmark($stateParams.id)
    .then(function(response){
       $scope.editBookmark=response.data;
       $scope.editBookmark.inputTags=response.data.tags.split(',').sort();
       if($scope.editBookmark.inputTags.length == 1){
         $scope.showEditTagField=false;
       }else{
         $scope.showEditTagField=true;
       }
    });


    $scope.loadTags=function(){
      TagService.getTags()
      .then(function(response){
          $scope.allTags=response.data.map(function(element){return element.tag;}).sort();
          $scope.editTags=getSuggestionTags($scope.allTags,$scope.editBookmark.inputTags);
          $scope.editTags.sort();
      });
    }

    $scope.loadTags();

    $scope.removeEditTag=function(tag){
      $scope.editBookmark.inputTags.splice($scope.editBookmark.inputTags.indexOf(tag),1);
      $scope.editTags.push(tag);   $scope.editTags.sort();
      if($scope.editBookmark.inputTags.length < 1){
        $scope.showEditTagField=true;
      }
      focus('editBookmarkTagsInput');
    }

    $scope.selectEditTag=function(tag){
      $scope.editBookmark.inputTags.push(tag);
      $scope.editTags.splice($scope.editTags.indexOf(tag),1);  
      $scope.editTags.sort();
      $scope.editTagText.input=null;
      if($scope.editBookmark.inputTags.length >= 1){
        $scope.showEditTagField=false;
      }
      focus('editBookmarkTagsInput');
    }

    $scope.sendEmail=function(bookmark){
      $scope.emailBookmarkMessage=null;
      console.log("Bookmark "+JSON.stringify(bookmark));
       if(Helpers.undefined_or_empty(bookmark.link)){$scope.emailBookmarkMessage='Nay! looks like there is No Medicine'; return;}
       if(Helpers.undefined_or_empty(bookmark.description)){$scope.emailBookmarkMessage='Please fill in Indications'; return;}
       if(bookmark.inputTags.length < 1){$scope.emailBookmarkMessage='Nay! we need at least one Patient'; return;}
       var comma_separated_tags=Helpers.commaSeparatedTags(bookmark.inputTags);
       var request_body={"link":bookmark.link,"description":bookmark.description,"tags":comma_separated_tags,"to":bookmark.email};
       BookmarkService.sendEmail(request_body)
       .then(function(response){
               toaster.pop('success','Email sent successfully');
               setTimeout(function(){$state.go('list');},2000);
            },
            function(error){ console.log("Error while sending Email"); }
          );
    }

    $scope.$on('newTagAdded', function(event, data){
      focus('editBookmarkTagsInput');
      $scope.loadTags();
    });

    $scope.cancelUpdate=function(){
           $state.go('list');
    }

    $scope.showCreateEditTagModal=function(){
      $scope.tagModal=$modal({scope:$scope,show:true,placement:'center',
                              controller:'TagController',templateUrl:'templates/create_tag_modal.html'});
      $scope.editTagText.input=null;
    }

});

function getSuggestionTags(allTags,bookmarkTags ) {
  return allTags.filter(function (tag) {
      return bookmarkTags.indexOf(tag) == -1;
  });
}
