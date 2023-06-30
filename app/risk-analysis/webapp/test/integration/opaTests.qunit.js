sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'ns/riskanalysis/test/integration/FirstJourney',
		'ns/riskanalysis/test/integration/pages/RisksAnalysisList',
		'ns/riskanalysis/test/integration/pages/RisksAnalysisObjectPage'
    ],
    function(JourneyRunner, opaJourney, RisksAnalysisList, RisksAnalysisObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('ns/riskanalysis') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheRisksAnalysisList: RisksAnalysisList,
					onTheRisksAnalysisObjectPage: RisksAnalysisObjectPage
                }
            },
            opaJourney.run
        );
    }
);