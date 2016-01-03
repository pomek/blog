module Jekyll
    module PolishDates
        MONTHS = {
            "01" => "stycznia",
            "02" => "lutego",
            "03" => "marca",

            "04" => "kwietnia",
            "05" => "maja",
            "06" => "czerwca",

            "07" => "lipca",
            "08" => "sierpnia",
            "09" => "września",

            "10" => "października",
            "11" => "listopada",
            "12" => "grudnia"
        }

        def polishDate(date)
            day = time(date).strftime("%e")
            month = time(date).strftime("%m")
            year = time(date).strftime("%Y")

            day + ' ' + MONTHS[month] + ' ' + year
        end
    end
end

Liquid::Template.register_filter(Jekyll::PolishDates)
