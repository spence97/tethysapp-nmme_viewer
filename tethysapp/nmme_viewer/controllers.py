from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from tethys_sdk.gizmos import *
import os
from datetime import datetime,timedelta
import datetime

Forecast_dir = '/Users/Student/Documents/LIS/Forecast GTiffs/'

def home(request):
    """
    Controller for the app home page.
    """
    geotiff_dir = '/Users/Student/Documents/LIS/Forecast GTiffs/PRECTOT/Mean'
    sorted_files = sorted(os.listdir(geotiff_dir))
    sorted_dates = []
    for file in sorted_files:
        date = file.split("_")[0]
        sorted_dates.append(date)

    forecast_month_options = [('January','01'),('May','05'),('June','06'),('July','07'),('August','08'),('September','09'),('October','10'),('November','11'),('December','12')]
    forecast_year_options = []
    year_list = range(1983,2016)
    for year in year_list:
        forecast_year_options.append([year,year])

    # for year in range(1983, 2015):
    #     start_date = '05/01/' + str(year)
    #     date_str = datetime.datetime.strptime(start_date, "%m/%d/%Y")
    #     days = 1
    #     for i in range(37):
    #         if i == 0:
    #             end_date = date_str
    #         else:
    #             days += 31
    #             end_date = date_str + timedelta(days=float(days - 1))
    #
    #         ts_file_name = end_date.strftime("%Y%m")
    #         date_name = end_date.strftime("%Y%m%d")
    #         year = int(ts_file_name[0:4])
    #         month = int(ts_file_name[4:6])
    #         day = int(date_name[6:8])
    #         new_date_str = datetime.datetime(year, month, day)
    #         new_date_str = new_date_str.strftime("%B %Y")
    #         forecast_layer_options.append([new_date_str,ts_file_name])


    layers_length = len(forecast_month_options)
    # for date in sorted_dates:
    #     year = int(date[0:4])
    #     month = int(date[4:6])
    #     day = 01
    #     # day = int(file[:-4].split('_')[2])
    #     date_str = datetime.datetime(year, month, day)
    #     date_str = date_str.strftime("%B %Y")
    #     forecast_layer_options.append([date_str, date])
    #     print(date_str)

    select_year = SelectInput(display_text='Select a Forecast Year',
                               name='select_year',
                               multiple=False,
                               options= forecast_year_options,
                               initial=['1983'])

    select_init = SelectInput(display_text='Select a Forecast Initialization Month',
                              name='select_init',
                              multiple=False,
                              options=[('January','01'),('February','02'),('March','03'),('April','04'),('May','05'),('June','06'),('July','07'),('August','08'),('September','09'),('October','10'),('November','11'),('December','12')],
                              initial=['May'])

    select_layer = SelectInput(display_text='Select a Forecast Month',
                              name='select_layer',
                              multiple=False,
                              options=forecast_month_options,
                              initial=['January'])


    Var_Select = SelectInput(display_text='Select Variable to Display',
                        name='var_select',
                        multiple=False,
                        options=[('Total Precipitation (cm)', 'PRECTOT'),('2m Air Temperature (C)','T2M')],
                        initial=['Total Precipitation (cm)'])

    Model_Select = SelectInput (display_text='Select Forecast Model to Display',
                        name='mod_select',
                        multiple=False,
                        options=[('GEOS5','GEOS5'),('CFSv2 (Currently Not Available)','CFSv2'),('CMC1 (Currently Not Available)','CMC1'),('NCAR_CESM (Currently Not Available)','NCAR_CESM'),('NCAR_CCSM4 (Currently Not Available)','NCAR_CCSM4'),('NASA (Currently Not Available)','NASA'),('NMME (Currently Not Available)','NMME')],
                        initial=['GEOS5'])

    obs_select = SelectInput(display_text='Select Observation Data to Display',
                               name='obs_select',
                               multiple=False,
                               options=[('University of Delaware','UDEL')],
                               initial=['University of Delaware'])

    Stat_Select = SelectInput (display_text='Select Ensemble Statistic to Display',
                        name='stat_select',
                        multiple=False,
                        options=[('Mean','Mean'), ('Max','Max'),('Min','Min')],
                        initial=['Mean'])




    context = {
        "select_year":select_year,
        "select_init":select_init,
        "select_layer":select_layer,
        "slider_max":layers_length,
        "Var_Select":Var_Select,
        "obs_select":obs_select,
        "Model_Select":Model_Select,
        "Stat_Select":Stat_Select,

    }

    return render(request, 'nmme_viewer/home.html', context)