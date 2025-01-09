var getCategory;
var getMessage;
var rulesByCategory;

function build_rules() {

    function in_array(value, array) {
        return array.indexOf(value) !== -1;
    }

    // \x02 is the ASCII char:       002   2     02    STX (start of text)
    // Full sentence: includes all the `X la, Y la, ... Z`
    // Partial sentence: includes only one la/main-block
    let FULL_SENTENCE_SEPARATOR    = /(([\x02;.·…!?“”])\s*)/.source;
    let PARTIAL_SENTENCE_SEPARATOR = /([\x02;.·…!?“”:]|\bnan\b|\bnen\b|\bnin\b|\bnon\b|\bnun\b)/.source;
    let PARTICLES = 'en|li|e|la|pi|o|anu';
    let PREPOSITIONS = 'lon|tawa|tan|sama|kepeken';
    let PREVERBS = 'wile|sona|awen|kama|ken|lukin|open|pini|alasa';
    let PROPER_NOUNS = "((Jan|Jen|Jon|Jun|Kan|Ken|Kin|Kon|Kun|Lan|Len|Lin|Lon|Lun|Man|Men|Min|Mon|Mun|Nan|Nen|Nin|Non|Nun|Pan|Pen|Pin|Pon|Pun|San|Sen|Sin|Son|Sun|Tan|Ten|Ton|Tun|Wan|Wen|Win|An|En|In|On|Un|Ja|Je|Jo|Ju|Ka|Ke|Ki|Ko|Ku|La|Le|Li|Lo|Lu|Ma|Me|Mi|Mo|Mu|Na|Ne|Ni|No|Nu|Pa|Pe|Pi|Po|Pu|Sa|Se|Si|So|Su|Ta|Te|To|Tu|Wa|We|Wi|A|E|I|O|U)(jan|jen|jon|jun|kan|ken|kin|kon|kun|lan|len|lin|lon|lun|man|men|min|mon|mun|nan|nen|nin|non|nun|pan|pen|pin|pon|pun|san|sen|sin|son|sun|tan|ten|ton|tun|wan|wen|win|ja|je|jo|ju|ka|ke|ki|ko|ku|la|le|li|lo|lu|ma|me|mi|mo|mu|na|ne|ni|no|nu|pa|pe|pi|po|pu|sa|se|si|so|su|ta|te|to|tu|wa|we|wi)*)";

    let endsWithPartialSentenceBegin = new RegExp('(' + PARTIAL_SENTENCE_SEPARATOR + ')$');
    let endsWithFullSentenceBegin = new RegExp('(' + FULL_SENTENCE_SEPARATOR + ')$');
    let startsWithFullSentenceBegin = new RegExp('^(' + FULL_SENTENCE_SEPARATOR + ')');

    function startOfPartialSentence(match, behind) {
        return behind.match(endsWithPartialSentenceBegin);
    }

    function startOfFullSentence(match, behind) {
        return behind.match(endsWithFullSentenceBegin) || match[0].match(startsWithFullSentenceBegin);
    }

    function normalizePartialSentence(sentence) {
        // Clean punctuation, interjections and other particle words
        return sentence.replace(/^o,/, '')
                           .replace(/[^\w ]/g, ' ')
                           .replace(/\s+/g, ' ')
                           .trim()
                           .replace(/^((la|taso|a+(\s+a+)*)\s+)*/, '')
                           .replace(/\bla$/, '')
                           .trim();
    }

    function startingMiSinaIsntASubjectInTheMatch(m, behind) {
        return m[0].match(/^(mi|sina)\s/) && !startOfPartialSentence(m, behind)
    }

    function Err(rule, message, category, more_infos, custom_tokenizer) {
        this.raw_rule = rule;

        if(typeof(rule[0]) === "undefined") {
            this.rule = new RegExp('^(' + rule.source + ')');
        } else {
            this.rule = [
                new RegExp('^(' + rule[0].source + ')'),
                rule[1]
            ];
        }
        this._regex = typeof(rule[0]) === "undefined" ? this.rule : this.rule[0];

        this.getMatch = function(line) {
            return line.match(this._regex.source);
        }

        this.message = message;
        this.category = category;
        this.more_infos = more_infos;
        this.tokenize = custom_tokenizer;
    }

    var rules = {

        // Ignore URLs
        url: new Err(
            // URL regex from https://stackoverflow.com/a/3809435
            /(https?:\/\/(www\.)?)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i,
            '', false
        ),

        argumentInitial: new Err(
            [
                new RegExp(
                    PARTIAL_SENTENCE_SEPARATOR + '(\\s*)(\\b[aeiou]\\w*\\b)'
                ),
            ],
            'A phrase must begin with a verb',
            'error',
            null,
            (key, match) => {
                return [
                    {
                        text: match[2].replace(/\x02/g, ''),
                        ruleName: 'partialSentenceSeparator',
                        match: match,
                    },
                    {
                        text: match[3].replace(/\x02/g, ''),
                        ruleName: 'punctuation',
                        match: match,
                    },
                    {
                        text: match[4].replace(/\x02/g, ''),
                        ruleName: key,
                        match: match,
                    },
                ];
            }
        ),

        verbNonInitial: new Err(
            [
                new RegExp(
                    PARTIAL_SENTENCE_SEPARATOR + '((\\s*\\b\\w+\\b\\s+)+)' + '(\\b(?![aeioun])\\w*\\b)'
                ),
            ],
            'A verb must appear at the beginning of a phrase',
            'error',
            null,
            (key, match) => {
                return [
                    {
                        text: match[2].replace(/\x02/g, ''),
                        ruleName: 'partialSentenceSeparator',
                        match: match,
                    },
                    {
                        text: match[3].replace(/\x02/g, ''),
                        ruleName: 'ignore',
                        match: match,
                    },
                    {
                        text: match[5].replace(/\x02/g, ''),
                        ruleName: key,
                        match: match,
                    },
                ];
            }
        ),

        startOfText: new Err(
            /\x02/, '', false
        ),

        punctuation: new Err(/[^a-zA-Z]/, '', false),
        ignore: new Err(/./, '', false),

        wat: new Err(/^$/),
    };

    rulesByCategory = {};

    Object.keys(rules).forEach(function(key) {
        let category = rules[key].category

        if(!category) return;

        if(!(category in rulesByCategory))
            rulesByCategory[category] = [];

        rulesByCategory[category].push(key);
    });

    getCategory = function(key) {
        if(!(key in rules))
            return false;

        return rules[key].category;
    };

    getMessage = function(key, match) {
        if(!(key in rules))
            return false;

        let err = rules[key]
        let message = err.message;

        if(typeof(message) == 'function') {
            message = message(match);
        }

        for(var i=1; i<match.length; i++) {
            message = message.replace(new RegExp('\\$'+(i-1), 'g'), match[i]);
        }

        if(err.more_infos) {
            message += '<br><a  class="more-infos" target="_blank" href="' + err.more_infos + '">[Learn more]</a>';
        }

        return message;
    };

    return rules;
};

if(typeof(module) != 'undefined') {
    module.exports = {
        build_rules: build_rules,
    };
}