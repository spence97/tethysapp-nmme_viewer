from tethys_sdk.base import TethysAppBase, url_map_maker


class NmmeViewer(TethysAppBase):
    """
    Tethys app class for NMME Viewer.
    """

    name = 'NMME Forecast Viewer'
    index = 'nmme_viewer:home'
    icon = 'nmme_viewer/images/Light_Rain_Showers.png'
    package = 'nmme_viewer'
    root_url = 'nmme-viewer'
    color = '#003d77'
    description = 'View NMME Forecasts.'
    tags = '&quot;GEOS5&quot;, &quot;NMME&quot;, &quot;UDEL&quot;, &quot;Air Temp Forecasts&quot;, &quot;Precipitation Forecasts&quot;'
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='nmme-viewer',
                controller='nmme_viewer.controllers.home'
            ),
        )

        return url_maps
