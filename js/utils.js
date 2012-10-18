/***************************************************************************
			UTILS FUNCTIONS
***************************************************************************/

	//Shorten the vertex function
	function v(x,y,z){ 
		return new THREE.Vector3(x,y,z); 
	}

	//Initializing Three.js renderer
	function initRenderer(width,height) {
		//Creating application Three.js renderer
		renderer = new THREE.WebGLRenderer({ antialias: true });

		//Creating new DOM element
		container = document.createElement('div');
		document.body.appendChild(container);

		//Settin renderer size and adding to the DOM
		renderer.autoClear = false;
		renderer.setSize(width, height );
		container.appendChild( renderer.domElement );
		
		
		//Binding to UI elements so camera won't move while manipulating UI
		$('.UI').live("mouseover",function(event){
			controlsOff();			
		});
		
		
		//Binding to UI elements so camera restarts when exiting UI
		$('.UI').live("mouseout",function(event){
			controlsOn();			
		});
	}
	
	//Initializing UI elements
	function initUI() {
		//Create sliders
		$( ".sliderCoord" ).slider({
			value:1,
			min: 0,
			max: 2,
			step: 0.2,
			slide: function( event, ui ) {
				//recreating dataset points
				for(var i=0;i<datasets.length;i++) {
					datasets[i].center([$( "#sliderX" ).slider('value'),$( "#sliderY" ).slider('value'),$( "#sliderZ" ).slider('value')]);
				}
				//Refreshing worlds
				for(var i=0;i<worlds.length;i++) {
					worlds[i].refreshDataSets();
				}
			}
		});
		
		//Create accordions
		$("#accordion").accordion({ heightStyle: "content"});

		$("#worldAccordion").buttonset();
		
		
		//Bind events 
		$(".UIControl").bind("click", function (event) {
			//Show/hide UI
			$(".UI").fadeToggle('slow');
		});
		
		$("#newDataSet").bind("change", function (event) {
			startRead();
		});
		
		$(".checkWorld").bind("change",function (event) {
			var $this = $(this);
			worlds[$this.val()].toggle();
			numWorlds = $(".checkWorld:checked").length;
			setWorlds();
		});

		//Bind Cluster File upload now and in the future
		$(".clusterFile").live("change", function (event) {
			startReadCluster($(this).attr('id'));
		});
		
	}
	
	

	//Handler for data selection, binded to UI data representation fields
	function selectDataHandler(event) {
			// $this will contain a reference to the checkbox
			var $this = $(this);

			if (typeof $this.attr('name') !== 'undefined') {
				//remove current
				worlds[event.data.world-1].detachDataSet($this.attr('name'));
			}	
			if($("select[id='worldButtonData"+event.data.dataset+""+event.data.world+"'] option:selected").attr("class") == 'raw'){
				worlds[event.data.world-1].attachDataSet(datasets[event.data.dataset-1],event.data.dataset-1);
				$this.attr('name',event.data.dataset-1);
				//Clearing the cluster area
				$("#clusters"+(event.data.dataset)+"-"+(event.data.world)+"").empty();
			}
			else if($("select[id='worldButtonData"+event.data.dataset+""+event.data.world+"'] option:selected").attr("class") == 'noaction') {
				$this.removeAttr('name');
				//Clearing the cluster area
				$("#clusters"+(event.data.dataset)+"-"+(event.data.world)+"").empty();
			}
			else if($("select[id='worldButtonData"+event.data.dataset+""+event.data.world+"'] option:selected").attr("class") == 'clust') {
				var numClust = ($("select[id='worldButtonData"+event.data.dataset+""+event.data.world+"'] option:selected").val() - 1);
				worlds[event.data.world-1].attachDataSet(datasets[event.data.dataset-1],event.data.dataset-1,numClust);
				$this.attr('name',event.data.dataset-1);

				//Clearing the cluster area
				$("#clusters"+(event.data.dataset)+"-"+(event.data.world)+"").empty();
				//Creating All/None buttons
				$("#clusters"+(event.data.dataset)+"-"+(event.data.world)+"").append("<a href='#' class='allButton"+(event.data.dataset)+"-"+(event.data.world)+"'>All</a>/<a class='noneButton"+(event.data.dataset)+"-"+(event.data.world)+"' href='#'>None</a>");
				$(".allButton"+(event.data.dataset)+"-"+(event.data.world)+"").bind("click",{world:event.data.world,dataset:event.data.dataset,clustSet:numClust,numClust:datasets[event.data.dataset-1].clusterSets[numClust].numClust}, function(event) {
					$(".clusters"+(event.data.dataset)+"-"+(event.data.world)+"").attr("checked",true);
					for(var k=0;k<event.data.numClust;k++) {
						datasets[event.data.dataset-1].clusterSets[event.data.clustSet].visible[k] = true;
					}
					worlds[event.data.world-1].refreshDataSets();
				});
				$(".noneButton"+(event.data.dataset)+"-"+(event.data.world)+"").bind("click",{world:event.data.world,dataset:event.data.dataset,clustSet:numClust,numClust:datasets[event.data.dataset-1].clusterSets[numClust].numClust}, function(event) {
					$(".clusters"+(event.data.dataset)+"-"+(event.data.world)+"").attr("checked",false);
					for(var k=0;k<event.data.numClust;k++) {
						datasets[event.data.dataset-1].clusterSets[event.data.clustSet].visible[k] = false;
					}
					worlds[event.data.world-1].refreshDataSets();
				});
				//Iterating over each cluster				
				for(var k=0;k<datasets[event.data.dataset-1].clusterSets[numClust].numClust;k++) {
					var checked = (datasets[event.data.dataset-1].clusterSets[numClust].visible[k]) ? "checked" : "";
					$("#clusters"+(event.data.dataset)+"-"+(event.data.world)+"").append("<div id='divClust"+(event.data.dataset)+"-"+(event.data.world)+"-"+(k+1)+"' style='background-color:"+colorsCSS[k]+";padding-left:8px'>" +
						"<input type='checkbox' "+checked+" class='clusters"+(event.data.dataset)+"-"+(event.data.world)+"' id='clusters"+(event.data.dataset)+"-"+(event.data.world)+"-"+(k+1)+"'> "+
						"<label for='clusters"+(event.data.dataset)+"-"+(event.data.world)+"-"+(k+1)+"'>"+datasets[event.data.dataset-1].clusterSets[numClust].labels[k]+"</label>"+
						"<div style='float:right'><input type='text'size='10' id='colors"+(event.data.dataset)+"-"+(event.data.world)+"-"+(k+1)+"' style='font-size:10px;background:#"+('000000'+datasets[event.data.dataset-1].clusterSets[numClust].materials[k].color.getHex().toString(16)).slice(-6)+"' class=\"color\" value='"+('000000'+datasets[event.data.dataset-1].clusterSets[numClust].materials[k].color.getHex().toString(16)).slice(-6)+"'></div>"+
						"</div>");
					//Binding checkboxes
					$("#clusters"+(event.data.dataset)+"-"+(event.data.world)+"-"+(k+1)+"").bind("change",{world:event.data.world-1,dataset:event.data.dataset-1,clusterSet:numClust,cluster:k}, function(event) {
						var $this = $(this);
						if ($this.is(':checked')) {
						
							datasets[event.data.dataset].clusterSets[event.data.clusterSet].visible[event.data.cluster] = true;
						}
						else {
							datasets[event.data.dataset].clusterSets[event.data.clusterSet].visible[event.data.cluster] = false;
						}
						worlds[event.data.world].refreshDataSets();
					});
					//Binding color input
					$("#colors"+(event.data.dataset)+"-"+(event.data.world)+"-"+(k+1)+"").bind("change",{world:event.data.world-1,dataset:event.data.dataset-1,clusterSet:numClust,cluster:k}, function(event) {
						datasets[event.data.dataset].clusterSets[event.data.clusterSet].setColor(event.data.cluster,'0x'+$(this).val());
						$("#divClust"+(event.data.dataset+1)+"-"+(event.data.world+1)+"-"+(event.data.cluster+1)+"").css('background-color','#'+$(this).val());
					});
					
				}
			}
	}


	//Display message on command console
	function consoleMess(text) {
		if(typeof timeout !== 'undefined'){
			clearTimeout(timeout);
		}
		$("#console").text(text);
		$("#console").fadeIn('slow');
		timeout = setTimeout("$('#console').fadeOut('slow');",6000);
	}

	


	
	//Render all created worlds
	function renderWorlds () {
		for(var i=0;i<worlds.length;i++) {
			worlds[i].render();
		}
	}
	
	//Different world number options from 1 to 4
	function setWorlds () {
		var coord = new Array();
		var coordNum = 0;
		var i =0;
		if(numWorlds == 1) {
			coord = [[winWidth,winHeight,0,0]];
		}
		else if(numWorlds == 2) {
			coord = [[winWidth/2,winHeight,0,0],[winWidth/2,winHeight,winWidth/2,0]];
		}
		else if(numWorlds == 3) {
			coord = [[winWidth,winHeight/2,0,0],[winWidth/2,winHeight/2,0,winHeight/2],[winWidth/2,winHeight/2,winWidth/2,winHeight/2]];
		}
		else if (numWorlds == 4) {
			coord = [[winWidth/2,winHeight/2,0,0],[winWidth/2,winHeight/2,winWidth/2,0],[winWidth/2,winHeight/2,0,winHeight/2],[winWidth/2,winHeight/2,winWidth/2,winHeight/2]];
		}
		else {
			alert("invalid number of worlds");
		}
		
		while(coordNum < numWorlds) {
			if(worlds[i].visible) {
				worlds[i].changeSize(coord[coordNum][0],coord[coordNum][1],coord[coordNum][2],coord[coordNum][3]);
				coordNum++;
			}
			i++;
		}
	}

	//Cut all controls
	function controlsOff () {

		for(var i=0;i<worlds.length;i++) {
			worlds[i].disableControls();
		}
	}

	//turn on all controls
	function controlsOn () {
		for(var i=0;i<worlds.length;i++) {
			worlds[i].enableControls();
		}
	}


	//Load Data From Json File
	function setFactory(jsonFile,cluster) {
		$.getJSON(jsonFile,function(data) {
			  //Reading Json and creating Object
			  var index = datasets.push(new DataSet());
			  datasets[index-1].setPoints(data.dataset.points);
			  if(typeof data.dataset.name !== 'undefined' && data.dataset.name !== '') {
				datasets[index-1].setName(data.dataset.name);
			  }
			  else {
				datasets[index-1].setName("Dataset #"+index);
			  }

			  datasets[index-1].loaded = true;

			  addDataSetUI(index);
			  clusterSetFactory(cluster,index);
		});	
	}
	
	
	//Load cluster From Json File
	function clusterSetFactory(jsonFile,index) {
		$.getJSON(jsonFile,function(data) {
			
			addClusterUI((index-1),index,data.cluster);
		});	
	}
	
	
	function getUrlVars()
	{
		var vars = [], hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++)
		{
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	}

 
