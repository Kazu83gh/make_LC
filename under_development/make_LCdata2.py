#!/usr/bin/python3 --

import cgi
import psycopg2
from psycopg2 import Error
import numpy as np     # 数学計算モジュール
import json

form = cgi.FieldStorage()

try:
    #データベースからデータを取得する
    DB =  psycopg2.connect('postgresql://{user}:{password}@{host}:{port}/{dbname}'.format( 
                user="#####",        #ユーザ
                password="#####",    #パスワード
                host="#####",        #ホスト名
                port="#####",        #ポート
                dbname="#####"))     #データベース名

    #検索条件の変数
    #form.getvalue(' * ')はjavascriptのajaxで渡されたデータを取得している 
    #型を宣言したほうが扱いやすくなる   
    dptc_zero = int(form.getvalue('dptc_zero'))
    timescale = str(form.getvalue('timescale'))
    ra = float(form.getvalue('ra'))
    dec = float(form.getvalue('dec'))
    energy = str(form.getvalue('energy'))
    r_out = 1.5 #DBからデータを取得する際の半径(度)
    start_dptc = 11040 #基準からどのくらい前までのデータを取得するか(秒)

    tmp = [] #取得する四角領域の範囲を格納する
    
    if timescale == '1day':
        end_dptc = int(86400) #後1日
    elif timescale == '4orb':
        end_dptc = int(22080) #後4orb
    else :
        end_dptc = int(11040) #後2orb

    #######################################################################################################
    
    # radec_sqlの設定
    # 正方領域で値を取得後に円領域で範囲を得るためのSQL文の作成
    xy  = np.cos(np.deg2rad(dec))
    z0  = np.sin(np.deg2rad(dec))
    d   = np.cos(np.deg2rad(r_out))

    if (dec + r_out) <= 90 and (dec - r_out) >= -90:
        d_ra = np.rad2deg(np.arccos(np.sqrt(d*d - z0*z0) / xy))

    if (dec + r_out) >= 90:
        tmp.append(dec - r_out)
        radec_sql = " WHERE dec > {0}".format(*tmp)
    elif (dec - r_out) <= -90:
        tmp.append(dec - r_out)
        radec_sql = " WHERE dec > {0}".format(*tmp)
    else:
        if (d_ra <= 2*r_out):
            if (ra + d_ra) > 360:
                tmp.append(ra - d_ra)
                tmp.append(ra + d_ra - 360)
                tmp.append(dec - r_out)
                tmp.append(dec + r_out)
                radec_sql = " WHERE (ra > {0} or ra < {1}) and (dec between {2} and {3})".format(*tmp)
            elif (ra - d_ra) < 0:
                tmp.append(360 + ra - d_ra)
                tmp.append(ra + d_ra)
                tmp.append(dec - r_out)
                tmp.append(dec + r_out)
                radec_sql = " WHERE (ra > {0} or ra < {1}) and (dec between {2} and {3})".format(*tmp)
            else:
                tmp.append(ra - d_ra)
                tmp.append(ra + d_ra)
                tmp.append(dec - r_out)
                tmp.append(dec + r_out)
                radec_sql = " WHERE  ra between {0} and {1} and (dec between {2} and {3})".format(*tmp)
        else:
            if (ra + d_ra) > 360:
                tmp.append(dec - r_out)
                tmp.append(dec + r_out)
                tmp.append(ra - d_ra)
                tmp.append(ra + d_ra - 360)
                radec_sql = " WHERE dec between {0} and {1} and (ra > {2} or ra < {3})".format(*tmp)
            elif (ra - d_ra) < 0:
                tmp.append(dec - r_out)
                tmp.append(dec + r_out)
                tmp.append(ra - d_ra + 360)
                tmp.append(ra + d_ra)
                radec_sql = " WHERE dec between {0} and {1} and (ra > {2} or ra < {3})".format(*tmp)
            else:
                tmp.append(dec - r_out)
                tmp.append(dec + r_out)
                tmp.append(ra - d_ra)
                tmp.append(ra + d_ra)
                radec_sql = " WHERE dec between {0} and {1} and (ra between {2} and {3})".format(*tmp)

    cirsql = " WHERE(acos(sin(radians({0}))*sin(radians(dec)) + cos(radians({0}))*cos(radians(dec))*cos(radians({1} - ra)) ) < radians({2}))".format(dec, ra, r_out)

    #######################################################################################################

    # dptc_psqlの設定  
    start_dptc = dptc_zero - start_dptc 
    end_dptc = dptc_zero + end_dptc

    dptc_sql = ' dptc >= ' + str(start_dptc) + ' AND dptc <= ' + str(end_dptc)

    # 実行するSQL文
    psqlterms = 'SELECT * FROM (SELECT dptc, pi, ra, dec from gcaspev8' + radec_sql + 'AND' + dptc_sql + ' ORDER BY dptc)' + ' AS tmptable '+ cirsql 

    #######################################################################################################

    # postgeSQLで実行
    cursor = DB.cursor()
    cursor.execute(psqlterms) #データの検索条件を与える
    result = cursor.fetchall() 

    # resultは行をタプルで取得し,リスト化する関数　
    # result = [(dptc, camearaid, ra, ..), (dptc, cameraid, ra, ..), .....]
    # resultの各タプルから同じ要素ごとに取り出し、リストに入れなおす
    def TUPtoLIS (a):     
        return [list(tup) for tup in zip(*result)] #zipは複数のリストに対応できる
        
    #newresult = [[dptc, dptc, ..], [cameraid, cameraid, ..], [ra, ra, ..], ...]
    newresult = TUPtoLIS(result)

    # dptcだけのリスト
    columm_dptc = newresult[0]

    # piだけのリスト
    columm_pi = newresult[1]

    # piの値を参照してエネルギーバンドごとのdptcリストを作成
    def high_pifilter (array):
        highpi = []
        for k in range(0,len(array)):
            if 200 <= array[k] <400:
                highpi.append(columm_dptc[k])
        return (highpi)

    def med_pifilter(array):
        medpi = []
        for k in range(0,len(array)):
            if 80 <= array[k] <200:
                medpi.append(columm_dptc[k])
        return(medpi)

    def low_pifilter(array):
        lowpi = []
        for k in range(0,len(array)):
            if 40 <= array[k] <80:
                lowpi.append(columm_dptc[k])
        return(lowpi)

    # dptcを[時間x, xでのカウント数, x+1, x+1でのカウント数, ....]とリスト化する
    def changeLIS (d):        
        list_dptc = [d[0]]    
        i = -1
        k = -1
        for c in d:
            i += 1
            k += 1
            if i != 0:
                if d[i] != d[i-1]:
                    list_dptc.append(k)
                    list_dptc.append(d[i])
                    k = 0
        n = k +1
        list_dptc.append(n)
        return(list_dptc)
        
    all_LCdata = changeLIS(columm_dptc) 
    high_LCdata = changeLIS(high_pifilter(columm_pi))
    med_LCdata = changeLIS(med_pifilter(columm_pi))
    low_LCdata = changeLIS(low_pifilter(columm_pi))

    # 全てのLCdataを辞書型(dict)に格納
    dict_LCdata = {"All":all_LCdata, "High":high_LCdata, "Med":med_LCdata, "Low":low_LCdata}

    #######################################################################################################

    # javascriptに辞書の受け渡し(java側ではrecieved_data)
    print('Content-type: text/htmml\n')
    print(json.dumps(dict_LCdata))


except(Exception, Error) as error:
       print('Content-type: text/htmml\n')
       print("An error occurred while connecting to the database")


finally:
    cursor.close()
    DB.close()
