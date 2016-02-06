module Jekyll
    module Timestamp
        def timestamp(date)
            time(date).to_i
        end
    end
end

Liquid::Template.register_filter(Jekyll::Timestamp)
